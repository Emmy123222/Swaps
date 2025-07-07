module aptos_swap::swap {
    use std::signer;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use std::string::{Self, String};
    use aptos_std::math64;
    use aptos_std::type_info;
    use aptos_std::math128;
    use aptos_std::option;
    use std::vector;

    /// Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_POOL_NOT_EXISTS: u64 = 2;
    const E_INSUFFICIENT_LIQUIDITY: u64 = 3;
    const E_SLIPPAGE_EXCEEDED: u64 = 4;
    const E_INVALID_AMOUNT: u64 = 5;
    const E_POOL_ALREADY_EXISTS: u64 = 6;
    const E_INVALID_TOKEN_PAIR: u64 = 7;
    const E_INVALID_FEE_RATE: u64 = 8;
    const E_ZERO_LIQUIDITY: u64 = 9;
    const E_NO_SUPPLY: u64 = 10;

    /// Liquidity pool structure
    struct LiquidityPool<phantom X, phantom Y> has key {
        coin_x_reserve: Coin<X>,
        coin_y_reserve: Coin<Y>,
        lp_mint_cap: coin::MintCapability<LPCoin<X, Y>>,
        lp_burn_cap: coin::BurnCapability<LPCoin<X, Y>>,
    }

    /// LP token
    struct LPCoin<phantom X, phantom Y> has key, store {}

    #[event]
    struct SwapEvent has drop, store {
        user: address,
        coin_x_in: u64,
        coin_y_in: u64,
        coin_x_out: u64,
        coin_y_out: u64,
        timestamp: u64,
        pool: String,
    }

    #[event]
    struct LiquidityEvent has drop, store {
        user: address,
        coin_x_amount: u64,
        coin_y_amount: u64,
        lp_tokens: u64,
        is_add: bool,
        timestamp: u64,
        pool: String,
    }

    /// Global swap data
    struct SwapData has key {
        admin: address,
        fee_rate: u64, // Fee rate in basis points (100 = 1%)
        swap_events: event::EventHandle<SwapEvent>,
        liquidity_events: event::EventHandle<LiquidityEvent>,
    }

    /// Compare two byte vectors lexicographically
    fun compare_bytes(a: &vector<u8>, b: &vector<u8>): bool {
        let len_a = vector::length(a);
        let len_b = vector::length(b);
        let min_len = if (len_a < len_b) len_a else len_b;
        let i = 0;
        while (i < min_len) {
            let byte_a = *vector::borrow(a, i);
            let byte_b = *vector::borrow(b, i);
            if (byte_a < byte_b) return true;
            if (byte_a > byte_b) return false;
            i = i + 1;
        };
        len_a < len_b
    }

    /// Initialize the swap module
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(!exists<SwapData>(admin_addr), E_POOL_ALREADY_EXISTS);

        // Create event handles using account::new_event_handle
        move_to(admin, SwapData {
            admin: admin_addr,
            fee_rate: 30, // 0.3% fee
            swap_events: account::new_event_handle<SwapEvent>(admin),
            liquidity_events: account::new_event_handle<LiquidityEvent>(admin),
        });
    }

    /// Update fee rate (admin only)
    public entry fun update_fee_rate(admin: &signer, new_fee_rate: u64) acquires SwapData {
        let admin_addr = signer::address_of(admin);
        let swap_data = borrow_global_mut<SwapData>(admin_addr);
        assert!(admin_addr == swap_data.admin, E_NOT_ADMIN);
        assert!(new_fee_rate <= 100, E_INVALID_FEE_RATE); // Max 1% fee
        swap_data.fee_rate = new_fee_rate;
    }

    /// Compare token types to enforce ordering
    fun compare_tokens<X, Y>(): bool {
        let x_type = type_info::type_name<X>();
        let y_type = type_info::type_name<Y>();
        compare_bytes(string::bytes(&x_type), string::bytes(&y_type))
    }

    /// Get pool name for events
    public fun get_pool_name<X, Y>(): String {
        let x_type = type_info::type_name<X>();
        let y_type = type_info::type_name<Y>();
        let x_type_copy = x_type;
        string::append(&mut x_type_copy, string::utf8(b"/"));
        string::append(&mut x_type_copy, y_type);
        x_type_copy
    }

    /// Create a new liquidity pool
    public entry fun create_pool<X, Y>(
        admin: &signer,
        coin_x_amount: u64,
        coin_y_amount: u64,
    ) acquires SwapData {
        let admin_addr = signer::address_of(admin);
        let swap_data = borrow_global<SwapData>(admin_addr);
        assert!(admin_addr == swap_data.admin, E_NOT_ADMIN);
        assert!(!exists<LiquidityPool<X, Y>>(admin_addr), E_POOL_ALREADY_EXISTS);
        assert!(coin_x_amount > 0 && coin_y_amount > 0, E_INVALID_AMOUNT);
        assert!(compare_tokens<X, Y>(), E_INVALID_TOKEN_PAIR);

        // Initialize LP coin - coin::initialize returns (burn_cap, freeze_cap, mint_cap)
        let (lp_burn_cap, lp_freeze_cap, lp_mint_cap) = coin::initialize<LPCoin<X, Y>>(
            admin,
            string::utf8(b"Aptos Swap LP"),
            string::utf8(b"ASP-LP"),
            8,
            true,
        );

        // Withdraw coins from admin
        let coin_x = coin::withdraw<X>(admin, coin_x_amount);
        let coin_y = coin::withdraw<Y>(admin, coin_y_amount);

        // Calculate initial LP tokens (geometric mean)
        let lp_tokens = (math128::sqrt((coin_x_amount as u128) * (coin_y_amount as u128)) as u64);
        assert!(lp_tokens > 0, E_INVALID_AMOUNT);

        // Mint initial LP tokens to admin before creating pool
        let lp_coin = coin::mint<LPCoin<X, Y>>(lp_tokens, &lp_mint_cap);
        coin::deposit(admin_addr, lp_coin);

        // Create pool
        let pool = LiquidityPool<X, Y> {
            coin_x_reserve: coin_x,
            coin_y_reserve: coin_y,
            lp_mint_cap,
            lp_burn_cap,
        };
        move_to(admin, pool);

        // Emit liquidity event
        let swap_data = borrow_global_mut<SwapData>(admin_addr);
        event::emit_event(&mut swap_data.liquidity_events, LiquidityEvent {
            user: admin_addr,
            coin_x_amount,
            coin_y_amount,
            lp_tokens,
            is_add: true,
            timestamp: timestamp::now_microseconds(),
            pool: get_pool_name<X, Y>(),
        });

        // Destroy the freeze capability as we don't need it
        coin::destroy_freeze_cap<LPCoin<X, Y>>(lp_freeze_cap);
    }

    /// Add liquidity to an existing pool
    public entry fun add_liquidity<X, Y>(
        user: &signer,
        coin_x_amount: u64,
        coin_y_amount: u64,
        min_lp_tokens: u64,
    ) acquires LiquidityPool, SwapData {
        let user_addr = signer::address_of(user);
        // Get admin address from SwapData to access the pool
        let admin_addr = get_admin_address();
        assert!(exists<LiquidityPool<X, Y>>(admin_addr), E_POOL_NOT_EXISTS);
        assert!(coin_x_amount > 0 && coin_y_amount > 0, E_INVALID_AMOUNT);

        let pool = borrow_global_mut<LiquidityPool<X, Y>>(admin_addr);
        let x_reserve = coin::value(&pool.coin_x_reserve);
        let y_reserve = coin::value(&pool.coin_y_reserve);
        assert!(x_reserve > 0 && y_reserve > 0, E_ZERO_LIQUIDITY);

        // Calculate LP tokens to mint
        let lp_supply_opt = coin::supply<LPCoin<X, Y>>();
        assert!(option::is_some(&lp_supply_opt), E_NO_SUPPLY);
        let lp_supply = option::extract(&mut lp_supply_opt) as u64;
        let lp_tokens = math64::min(
            ((coin_x_amount as u128) * (lp_supply as u128) / (x_reserve as u128)) as u64,
            ((coin_y_amount as u128) * (lp_supply as u128) / (y_reserve as u128)) as u64,
        );
        assert!(lp_tokens >= min_lp_tokens, E_SLIPPAGE_EXCEEDED);
        assert!(lp_tokens > 0, E_INVALID_AMOUNT);

        // Deposit coins
        let coin_x = coin::withdraw<X>(user, coin_x_amount);
        let coin_y = coin::withdraw<Y>(user, coin_y_amount);
        coin::merge(&mut pool.coin_x_reserve, coin_x);
        coin::merge(&mut pool.coin_y_reserve, coin_y);

        // Mint LP tokens
        let lp_coin = coin::mint<LPCoin<X, Y>>(lp_tokens, &pool.lp_mint_cap);
        coin::deposit(user_addr, lp_coin);

        // Emit liquidity event
        let swap_data = borrow_global_mut<SwapData>(admin_addr);
        event::emit_event(&mut swap_data.liquidity_events, LiquidityEvent {
            user: user_addr,
            coin_x_amount,
            coin_y_amount,
            lp_tokens,
            is_add: true,
            timestamp: timestamp::now_microseconds(),
            pool: get_pool_name<X, Y>(),
        });
    }

    /// Remove liquidity from a pool
    public entry fun remove_liquidity<X, Y>(
        user: &signer,
        lp_tokens: u64,
        min_x_out: u64,
        min_y_out: u64,
    ) acquires LiquidityPool, SwapData {
        let user_addr = signer::address_of(user);
        let admin_addr = get_admin_address();
        assert!(exists<LiquidityPool<X, Y>>(admin_addr), E_POOL_NOT_EXISTS);
        assert!(lp_tokens > 0, E_INVALID_AMOUNT);

        let pool = borrow_global_mut<LiquidityPool<X, Y>>(admin_addr);
        let x_reserve = coin::value(&pool.coin_x_reserve);
        let y_reserve = coin::value(&pool.coin_y_reserve);
        assert!(x_reserve > 0 && y_reserve > 0, E_ZERO_LIQUIDITY);

        let lp_supply_opt = coin::supply<LPCoin<X, Y>>();
        assert!(option::is_some(&lp_supply_opt), E_NO_SUPPLY);
        let lp_supply = option::extract(&mut lp_supply_opt) as u64;
        let x_out = ((lp_tokens as u128) * (x_reserve as u128) / (lp_supply as u128)) as u64;
        let y_out = ((lp_tokens as u128) * (y_reserve as u128) / (lp_supply as u128)) as u64;

        assert!(x_out >= min_x_out && y_out >= min_y_out, E_SLIPPAGE_EXCEEDED);
        assert!(x_out <= x_reserve && y_out <= y_reserve, E_INSUFFICIENT_LIQUIDITY);

        // Burn LP tokens
        let lp_coin = coin::withdraw<LPCoin<X, Y>>(user, lp_tokens);
        coin::burn<LPCoin<X, Y>>(lp_coin, &pool.lp_burn_cap);

        // Withdraw tokens
        let coin_x = coin::extract(&mut pool.coin_x_reserve, x_out);
        let coin_y = coin::extract(&mut pool.coin_y_reserve, y_out);
        coin::deposit(user_addr, coin_x);
        coin::deposit(user_addr, coin_y);

        // Emit liquidity event
        let swap_data = borrow_global_mut<SwapData>(admin_addr);
        event::emit_event(&mut swap_data.liquidity_events, LiquidityEvent {
            user: user_addr,
            coin_x_amount: x_out,
            coin_y_amount: y_out,
            lp_tokens,
            is_add: false,
            timestamp: timestamp::now_microseconds(),
            pool: get_pool_name<X, Y>(),
        });
    }

    /// Swap coin X for coin Y
    public entry fun swap_x_to_y<X, Y>(
        user: &signer,
        coin_x_amount: u64,
        min_coin_y_out: u64,
    ) acquires LiquidityPool, SwapData {
        let user_addr = signer::address_of(user);
        let admin_addr = get_admin_address();
        assert!(exists<LiquidityPool<X, Y>>(admin_addr), E_POOL_NOT_EXISTS);
        assert!(coin_x_amount > 0, E_INVALID_AMOUNT);

        let pool = borrow_global_mut<LiquidityPool<X, Y>>(admin_addr);
        let swap_data = borrow_global<SwapData>(admin_addr);

        let x_reserve = coin::value(&pool.coin_x_reserve);
        let y_reserve = coin::value(&pool.coin_y_reserve);
        assert!(y_reserve > 0, E_ZERO_LIQUIDITY);

        // Calculate output with fee
        let coin_y_out = calculate_output_amount(coin_x_amount, x_reserve, y_reserve, swap_data.fee_rate);
        assert!(coin_y_out >= min_coin_y_out, E_SLIPPAGE_EXCEEDED);
        assert!(coin_y_out <= y_reserve, E_INSUFFICIENT_LIQUIDITY);

        // Perform swap
        let coin_x_in = coin::withdraw<X>(user, coin_x_amount);
        let coin_y_out_coin = coin::extract(&mut pool.coin_y_reserve, coin_y_out);

        coin::merge(&mut pool.coin_x_reserve, coin_x_in);
        coin::deposit(user_addr, coin_y_out_coin);

        // Emit event
        let swap_data = borrow_global_mut<SwapData>(admin_addr);
        event::emit_event(&mut swap_data.swap_events, SwapEvent {
            user: user_addr,
            coin_x_in: coin_x_amount,
            coin_y_in: 0,
            coin_x_out: 0,
            coin_y_out,
            timestamp: timestamp::now_microseconds(),
            pool: get_pool_name<X, Y>(),
        });
    }

    /// Swap coin Y for coin X
    public entry fun swap_y_to_x<X, Y>(
        user: &signer,
        coin_y_amount: u64,
        min_coin_x_out: u64,
    ) acquires LiquidityPool, SwapData {
        let user_addr = signer::address_of(user);
        let admin_addr = get_admin_address();
        assert!(exists<LiquidityPool<X, Y>>(admin_addr), E_POOL_NOT_EXISTS);
        assert!(coin_y_amount > 0, E_INVALID_AMOUNT);

        let pool = borrow_global_mut<LiquidityPool<X, Y>>(admin_addr);
        let swap_data = borrow_global<SwapData>(admin_addr);

        let x_reserve = coin::value(&pool.coin_x_reserve);
        let y_reserve = coin::value(&pool.coin_y_reserve);
        assert!(x_reserve > 0, E_ZERO_LIQUIDITY);

        // Calculate output with fee
        let coin_x_out = calculate_output_amount(coin_y_amount, y_reserve, x_reserve, swap_data.fee_rate);
        assert!(coin_x_out >= min_coin_x_out, E_SLIPPAGE_EXCEEDED);
        assert!(coin_x_out <= x_reserve, E_INSUFFICIENT_LIQUIDITY);

        // Perform swap
        let coin_y_in = coin::withdraw<Y>(user, coin_y_amount);
        let coin_x_out_coin = coin::extract(&mut pool.coin_x_reserve, coin_x_out);

        coin::merge(&mut pool.coin_y_reserve, coin_y_in);
        coin::deposit(user_addr, coin_x_out_coin);

        // Emit event
        let swap_data = borrow_global_mut<SwapData>(admin_addr);
        event::emit_event(&mut swap_data.swap_events, SwapEvent {
            user: user_addr,
            coin_x_in: 0,
            coin_y_in: coin_y_amount,
            coin_x_out,
            coin_y_out: 0,
            timestamp: timestamp::now_microseconds(),
            pool: get_pool_name<X, Y>(),
        });
    }

    /// Calculate output amount with fee
    fun calculate_output_amount(
        input_amount: u64,
        input_reserve: u64,
        output_reserve: u64,
        fee_rate: u64,
    ): u64 {
        assert!(input_reserve > 0 && output_reserve > 0, E_ZERO_LIQUIDITY);
        let input_amount_with_fee = (input_amount as u128) * ((10000 - fee_rate) as u128);
        let numerator = input_amount_with_fee * (output_reserve as u128);
        let denominator = (input_reserve as u128) * 10000 + input_amount_with_fee;
        assert!(denominator > 0, E_INVALID_AMOUNT);
        (numerator / denominator) as u64
    }

    /// Helper function to get admin address
    fun get_admin_address(): address {
        // This assumes SwapData is stored at a known address
        // You'll need to adjust this based on your deployment strategy
        @aptos_swap
    }

    #[view]
    /// Returns the reserves for a pool
    public fun get_reserves<X, Y>(): (u64, u64) acquires LiquidityPool {
        let admin_addr = get_admin_address();
        assert!(exists<LiquidityPool<X, Y>>(admin_addr), E_POOL_NOT_EXISTS);
        let pool = borrow_global<LiquidityPool<X, Y>>(admin_addr);
        (coin::value(&pool.coin_x_reserve), coin::value(&pool.coin_y_reserve))
    }

    #[view]
    /// Returns the quote for a swap
    public fun get_quote<X, Y>(input_amount: u64, x_to_y: bool): u64 acquires LiquidityPool, SwapData {
        let admin_addr = get_admin_address();
        assert!(exists<LiquidityPool<X, Y>>(admin_addr), E_POOL_NOT_EXISTS);
        let pool = borrow_global<LiquidityPool<X, Y>>(admin_addr);
        let swap_data = borrow_global<SwapData>(admin_addr);

        let (input_reserve, output_reserve) = if (x_to_y) {
            (coin::value(&pool.coin_x_reserve), coin::value(&pool.coin_y_reserve))
        } else {
            (coin::value(&pool.coin_y_reserve), coin::value(&pool.coin_x_reserve))
        };

        calculate_output_amount(input_amount, input_reserve, output_reserve, swap_data.fee_rate)
    }
}