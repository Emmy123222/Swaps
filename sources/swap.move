module aptos_swap::swap {
    use std::signer;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use std::string;

    /// Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_POOL_NOT_EXISTS: u64 = 2;
    const E_INSUFFICIENT_LIQUIDITY: u64 = 3;
    const E_SLIPPAGE_EXCEEDED: u64 = 4;
    const E_INVALID_AMOUNT: u64 = 5;
    const E_POOL_ALREADY_EXISTS: u64 = 6;

    /// Liquidity pool structure
    struct LiquidityPool<phantom X, phantom Y> has key {
        coin_x_reserve: Coin<X>,
        coin_y_reserve: Coin<Y>,
        lp_mint_cap: coin::MintCapability<LPCoin<X, Y>>,
        lp_burn_cap: coin::BurnCapability<LPCoin<X, Y>>,
    }

    /// LP token
    struct LPCoin<phantom X, phantom Y> {}

    /// Swap event
    struct SwapEvent has drop, store {
        user: address,
        coin_x_in: u64,
        coin_y_in: u64,
        coin_x_out: u64,
        coin_y_out: u64,
        timestamp: u64,
    }

    /// Global swap data
    struct SwapData has key {
        admin: address,
        fee_rate: u64, // Fee rate in basis points (100 = 1%)
        swap_events: event::EventHandle<SwapEvent>,
    }

    /// Initialize the swap module
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        move_to(admin, SwapData {
            admin: admin_addr,
            fee_rate: 30, // 0.3% fee
            swap_events: event::new_event_handle<SwapEvent>(admin),
        });
    }

    /// Create a new liquidity pool
    public entry fun create_pool<X, Y>(
        admin: &signer,
        coin_x_amount: u64,
        coin_y_amount: u64,
    ) acquires SwapData {
        let admin_addr = signer::address_of(admin);
        let swap_data = borrow_global<SwapData>(@aptos_swap);
        assert!(admin_addr == swap_data.admin, E_NOT_ADMIN);
        
        assert!(!exists<LiquidityPool<X, Y>>(@aptos_swap), E_POOL_ALREADY_EXISTS);
        assert!(coin_x_amount > 0 && coin_y_amount > 0, E_INVALID_AMOUNT);

        // Initialize LP coin
        let (lp_mint_cap, lp_burn_cap) = coin::initialize<LPCoin<X, Y>>(
            admin,
            string::utf8(b"Aptos Swap LP"),
            string::utf8(b"ASP-LP"),
            8,
            false,
        );

        // Withdraw coins from admin
        let coin_x = coin::withdraw<X>(admin, coin_x_amount);
        let coin_y = coin::withdraw<Y>(admin, coin_y_amount);

        // Create pool
        let pool = LiquidityPool<X, Y> {
            coin_x_reserve: coin_x,
            coin_y_reserve: coin_y,
            lp_mint_cap,
            lp_burn_cap,
        };

        move_to(admin, pool);
    }

    /// Swap coin X for coin Y
    public entry fun swap_x_to_y<X, Y>(
        user: &signer,
        coin_x_amount: u64,
        min_coin_y_out: u64,
    ) acquires LiquidityPool, SwapData {
        assert!(exists<LiquidityPool<X, Y>>(@aptos_swap), E_POOL_NOT_EXISTS);
        assert!(coin_x_amount > 0, E_INVALID_AMOUNT);
        
        let pool = borrow_global_mut<LiquidityPool<X, Y>>(@aptos_swap);
        let swap_data = borrow_global_mut<SwapData>(@aptos_swap);
        
        let x_reserve = coin::value(&pool.coin_x_reserve);
        let y_reserve = coin::value(&pool.coin_y_reserve);
        
        // Calculate output with fee
        let coin_y_out = calculate_output_amount(coin_x_amount, x_reserve, y_reserve, swap_data.fee_rate);
        assert!(coin_y_out >= min_coin_y_out, E_SLIPPAGE_EXCEEDED);
        assert!(coin_y_out <= y_reserve, E_INSUFFICIENT_LIQUIDITY);
        
        // Perform swap
        let coin_x_in = coin::withdraw<X>(user, coin_x_amount);
        let coin_y_out_coin = coin::extract(&mut pool.coin_y_reserve, coin_y_out);
        
        coin::merge(&mut pool.coin_x_reserve, coin_x_in);
        coin::deposit(signer::address_of(user), coin_y_out_coin);
        
        // Emit event
        event::emit_event(&mut swap_data.swap_events, SwapEvent {
            user: signer::address_of(user),
            coin_x_in: coin_x_amount,
            coin_y_in: 0,
            coin_x_out: 0,
            coin_y_out,
            timestamp: timestamp::now_microseconds(),
        });
    }

    /// Swap coin Y for coin X
    public entry fun swap_y_to_x<X, Y>(
        user: &signer,
        coin_y_amount: u64,
        min_coin_x_out: u64,
    ) acquires LiquidityPool, SwapData {
        assert!(exists<LiquidityPool<X, Y>>(@aptos_swap), E_POOL_NOT_EXISTS);
        assert!(coin_y_amount > 0, E_INVALID_AMOUNT);
        
        let pool = borrow_global_mut<LiquidityPool<X, Y>>(@aptos_swap);
        let swap_data = borrow_global_mut<SwapData>(@aptos_swap);
        
        let x_reserve = coin::value(&pool.coin_x_reserve);
        let y_reserve = coin::value(&pool.coin_y_reserve);
        
        // Calculate output with fee
        let coin_x_out = calculate_output_amount(coin_y_amount, y_reserve, x_reserve, swap_data.fee_rate);
        assert!(coin_x_out >= min_coin_x_out, E_SLIPPAGE_EXCEEDED);
        assert!(coin_x_out <= x_reserve, E_INSUFFICIENT_LIQUIDITY);
        
        // Perform swap
        let coin_y_in = coin::withdraw<Y>(user, coin_y_amount);
        let coin_x_out_coin = coin::extract(&mut pool.coin_x_reserve, coin_x_out);
        
        coin::merge(&mut pool.coin_y_reserve, coin_y_in);
        coin::deposit(signer::address_of(user), coin_x_out_coin);
        
        // Emit event
        event::emit_event(&mut swap_data.swap_events, SwapEvent {
            user: signer::address_of(user),
            coin_x_in: 0,
            coin_y_in: coin_y_amount,
            coin_x_out,
            coin_y_out: 0,
            timestamp: timestamp::now_microseconds(),
        });
    }

    /// Calculate output amount with fee
    fun calculate_output_amount(
        input_amount: u64,
        input_reserve: u64,
        output_reserve: u64,
        fee_rate: u64,
    ): u64 {
        let input_amount_with_fee = input_amount * (10000 - fee_rate);
        let numerator = input_amount_with_fee * output_reserve;
        let denominator = (input_reserve * 10000) + input_amount_with_fee;
        numerator / denominator
    }

    #[view]
    public fun get_reserves<X, Y>(): (u64, u64) acquires LiquidityPool {
        assert!(exists<LiquidityPool<X, Y>>(@aptos_swap), E_POOL_NOT_EXISTS);
        let pool = borrow_global<LiquidityPool<X, Y>>(@aptos_swap);
        (coin::value(&pool.coin_x_reserve), coin::value(&pool.coin_y_reserve))
    }

    #[view]
    public fun get_quote<X, Y>(input_amount: u64, x_to_y: bool): u64 acquires LiquidityPool, SwapData {
        assert!(exists<LiquidityPool<X, Y>>(@aptos_swap), E_POOL_NOT_EXISTS);
        let pool = borrow_global<LiquidityPool<X, Y>>(@aptos_swap);
        let swap_data = borrow_global<SwapData>(@aptos_swap);
        
        let (input_reserve, output_reserve) = if (x_to_y) {
            (coin::value(&pool.coin_x_reserve), coin::value(&pool.coin_y_reserve))
        } else {
            (coin::value(&pool.coin_y_reserve), coin::value(&pool.coin_x_reserve))
        };
        
        calculate_output_amount(input_amount, input_reserve, output_reserve, swap_data.fee_rate)
    }
}