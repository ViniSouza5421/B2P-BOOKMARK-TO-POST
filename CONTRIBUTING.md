# Contributing to B2P (Bookmark To Post)

First off, thanks for taking the time to contribute! 🎉

## How to Contribute

### 1. Clone the Repository
```bash
git clone https://github.com/ViniSouza5421/B2P-BOOKMARK-TO-POST.git
cd B2P
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Development Mode
To build the extension for development:
```bash
npm run build
```
Since this is a Chrome Extension, there is no "hot reload" server in the traditional sense for the background/content scripts. You need to:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist/` folder
4. After making changes, run `npm run build` again and click the refresh icon on the extension card.

### 4. Code Style
Please ensure your code follows the project's coding standards.
- Use **ESLint** and **Prettier** (configs included).
- Keep functions small and focused.
- Add comments for complex logic.

### 5. Deployment / Release
The `dist` folder is the production artifact. Do not commit `dist` to version control if possible (it's in .gitignore), but it is required for loading into Chrome.

### 6. Pull Requests
- Create a new branch for your feature or fix.
- clearly describe the problem and solution.
- Ensure the build passes (`npm run build`).

Thank you for your help in making B2P better!
