# Price in Hours 💸⏰

A Chrome extension that converts e-commerce prices into hours of work based on your salary. Think twice before buying that expensive gadget! 🛒

## Features

✅ **Salary Configuration**: Set your monthly, daily, or hourly rate  
✅ **Multiple Currencies**: Supports AED, INR, and USD  
✅ **Smart Conversion**: Automatically calculates your hourly rate  
✅ **Price Badges**: Shows hours needed next to product prices  
✅ **Privacy First**: All data stored locally, nothing sent to servers

## Supported Sites

| Site            | Region |
| --------------- | ------ |
| 🛍️ noon.com     | UAE    |
| 🛒 amazon.ae    | UAE    |
| 🛒 amazon.in    | India  |
| 📦 flipkart.com | India  |
| 👗 myntra.com   | India  |

## Installation

### From Chrome Web Store

_(Coming soon)_

### Manual Installation (Developer Mode)

1. Download this repository
2. Go to `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the extension folder

## Usage

1. Click the extension icon in Chrome toolbar
2. Select your currency (AED, INR, USD)
3. Choose salary type (Monthly/Daily/Hourly)
4. Enter your salary amount
5. Configure work days/hours if needed
6. Click **Save Settings**
7. Visit a supported e-commerce site and see prices in hours! 🎉

## How It Works

The extension calculates your hourly rate based on your input:

- **Monthly**: `hourly = monthly / (days × hours)`
- **Daily**: `hourly = daily / hours`
- **Hourly**: Uses your input directly

Then displays a badge like: `💰 12.5 hrs` next to each price.

## Privacy

All data is stored locally on your device. We don't collect, transmit, or share any information. See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for details.

## Contributing

Pull requests are welcome! Please feel free to:

- 🐛 Report bugs
- 💡 Suggest new sites
- 🌐 Add new currency support

## License

MIT License - Use freely!

---

⭐ **Like this extension?** Give it a star on GitHub!

Made with ❤️ by [@aathil-Mr-ITGuy](https://github.com/aathil-Mr-ITGuy)
