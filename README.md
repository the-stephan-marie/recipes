# Camera Kit Web App

A beginner-friendly Camera Kit Web application built with Vite and TypeScript.

## Prerequisites

- Node.js and npm must be installed on your computer. npm comes bundled with Node.js by default and can be downloaded [here](https://nodejs.org/).
- **Having issues?** If you see "npm is not recognised as a command", see [SETUP.md](SETUP.md) for detailed installation instructions.

## Setup Instructions

1. **Install Node.js (if not already installed):**
   - Download and install from [nodejs.org](https://nodejs.org/) (LTS version recommended)
   - Make sure to check "Add to PATH" during installation
   - Restart VS Code/terminal after installation
   - See [SETUP.md](SETUP.md) for detailed instructions

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Get your API Token:**
   - Visit the [Snap Developer Portal](https://developers.snap.com/)
   - Get your Camera Kit API token
   - Replace `<YOUR_API_TOKEN>` in `src/main.ts` with your actual API token

4. **Get your Lens ID and Lens Group ID:**
   - Login to [My Lenses](https://lensstudio.snapchat.com/my-lenses)
   - Find the IDs for your specific Lenses and Lens Groups
   - Replace `<YOUR_LENS_ID>` and `<YOUR_LENS_GROUP_ID>` in `src/main.ts` with your actual IDs

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **View your app:**
   - **On your computer:** Open your browser and navigate to `https://localhost:5173/`
     - You'll see a security warning about the self-signed certificate - click "Advanced" and "Proceed to localhost" (this is safe for development)
   - **On your mobile device:**
     1. Make sure your phone is on the same Wi-Fi network as your computer
     2. Find your computer's local IP address:
        - Windows: Run `ipconfig` in Command Prompt and look for "IPv4 Address"
        - Example: `192.168.1.100`
     3. Open your mobile browser and navigate to `https://YOUR_IP_ADDRESS:5173/`
        - Example: `https://192.168.1.100:5173/`
     4. Accept the security warning about the self-signed certificate
     5. Accept the camera permissions prompt
   - You should see your webcam with the Lens applied!

## Project Structure

- `index.html` - Main HTML file with canvas element
- `src/main.ts` - Camera Kit implementation
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration

## Resources

- [Camera Kit Web Documentation](https://developers.snap.com/camera-kit/integrate-sdk/web)
- [Snap AR Discord](https://discord.gg/snapar)

