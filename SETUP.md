# Node.js Installation Guide

## Problem
If you see `npm is not recognised as a command`, it means Node.js (which includes npm) is not installed on your system.

## Solution: Install Node.js

### Option 1: Download from Official Website (Recommended)

1. **Visit the Node.js website:**
   - Go to [https://nodejs.org/](https://nodejs.org/)

2. **Download the LTS version:**
   - Click on the "LTS" (Long Term Support) version button
   - This will download an installer for Windows

3. **Run the installer:**
   - Double-click the downloaded `.msi` file
   - Follow the installation wizard
   - **Important:** Make sure to check the box that says "Add to PATH" during installation
   - Click "Next" through the installation steps
   - Click "Install" and wait for it to complete

4. **Restart your terminal/VS Code:**
   - Close your current terminal/VS Code window
   - Reopen VS Code to get a fresh terminal session

5. **Verify installation:**
   ```bash
   node --version
   npm --version
   ```
   Both commands should return version numbers.

### Option 2: Using Chocolatey (If you have it installed)

If you have Chocolatey package manager installed:
```bash
choco install nodejs
```

### Option 3: Using Winget (Windows Package Manager)

If you have winget installed:
```bash
winget install OpenJS.NodeJS.LTS
```

## After Installation

Once Node.js is installed, you can proceed with:

1. **Install project dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   - Navigate to `http://localhost:5173/`
   - Accept camera permissions
   - Enjoy your Camera Kit Web app!

## Troubleshooting

### If npm is still not recognized after installation:

1. **Restart your computer** - Sometimes Windows needs a full restart to update PATH
2. **Check PATH manually:**
   - Open System Properties → Environment Variables
   - Check if `C:\Program Files\nodejs` is in your PATH
   - If not, add it manually

3. **Use full path temporarily:**
   ```bash
   "C:\Program Files\nodejs\npm.cmd" install
   ```

### PowerShell Execution Policy Error

If you see an error like:
```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system
```

**Quick Fix - Use npm.cmd instead:**
```bash
npm.cmd --version
npm.cmd install
npm.cmd run dev
```

**Permanent Fix - Change Execution Policy (Run PowerShell as Administrator):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Or for the current session only:
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

**Alternative - Use Command Prompt instead of PowerShell:**
- In VS Code, click the dropdown next to the `+` button in the terminal
- Select "Command Prompt" instead of PowerShell
- npm should work normally in Command Prompt


