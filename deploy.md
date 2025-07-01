# Deploy Move Contract to Aptos Devnet

## Prerequisites

1. **Install Aptos CLI**
```bash
# On macOS
brew install aptos

# On Linux/WSL
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# On Windows (PowerShell)
iwr "https://aptos.dev/scripts/install_cli.py" -useb | Select-Object -ExpandProperty Content | python3
```

2. **Verify Installation**
```bash
aptos --version
```

## Setup Devnet Account

1. **Initialize Aptos CLI**
```bash
aptos init
```

When prompted:
- Choose network: `devnet`
- Enter private key: Press Enter to generate new key
- Save the generated private key and public key

2. **Fund Your Account**
```bash
aptos account fund-with-faucet --account YOUR_ADDRESS
```

Or visit: https://faucet.devnet.aptoslabs.com

## Configure Move.toml

Update your `Move.toml` file:

```toml
[package]
name = "AptosSwap"
version = "1.0.0"
authors = ["Your Name <your.email@example.com>"]

[addresses]
aptos_swap = "YOUR_ACCOUNT_ADDRESS"  # Replace with your actual address

[dev-addresses]
aptos_swap = "YOUR_ACCOUNT_ADDRESS"  # Same as above

[dependencies.AptosFramework]
git = "https://github.com/aptos-labs/aptos-core.git"
rev = "mainnet"
subdir = "aptos-move/framework/aptos-framework"

[dev-dependencies]
```

## Deployment Steps

1. **Compile the Contract**
```bash
aptos move compile
```

2. **Test the Contract (Optional)**
```bash
aptos move test
```

3. **Deploy to Devnet**
```bash
aptos move publish --profile devnet
```

If you get an error about the profile, create one:
```bash
aptos init --profile devnet --network devnet
```

## Verify Deployment

1. **Check on Explorer**
Visit: https://explorer.aptoslabs.com/account/YOUR_ADDRESS?network=devnet

2. **Verify Module**
```bash
aptos account list --query modules --account YOUR_ADDRESS --profile devnet
```

## Initialize the Swap Module

After deployment, initialize your swap module:

```bash
aptos move run \
  --function-id YOUR_ADDRESS::swap::initialize \
  --profile devnet
```

## Common Issues & Solutions

### Issue: "Account does not exist"
**Solution:** Fund your account with the faucet first

### Issue: "Insufficient gas"
**Solution:** Get more APT from the faucet

### Issue: "Module already exists"
**Solution:** Use `--upgrade-policy compatible` flag:
```bash
aptos move publish --profile devnet --upgrade-policy compatible
```

### Issue: "Address mismatch"
**Solution:** Make sure the address in Move.toml matches your account address

## Environment Variables

After deployment, update your frontend `.env` file:

```env
VITE_APTOS_NETWORK=devnet
VITE_APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com/v1
VITE_CONTRACT_ADDRESS=YOUR_DEPLOYED_ADDRESS
```

## Next Steps

1. **Create Liquidity Pools**
2. **Test Swapping Functions**
3. **Integrate with Frontend**
4. **Monitor on Explorer**

Your contract is now live on Aptos Devnet! 🚀