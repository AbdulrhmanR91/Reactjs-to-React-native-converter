# React to React Native Converter

A powerful tool that helps convert React web applications to React Native mobile applications.

## 🚀 Features

- Automatic conversion of React components to React Native components
- CSS to React Native StyleSheet conversion
- Handles common HTML elements mapping to React Native components
- Identifies and suggests replacements for web-only dependencies
- Browser-based interface for easy file upload
- Support for project-wide conversion

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Basic understanding of React and React Native

## 🌐 Online Tool

You can use the online version of this converter at:
[https://react-to-react-native.koyeb.app/](https://react-to-react-native.koyeb.app/)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/AbdulrhmanR91/Reactjs-to-React-native-converter.git
cd Reactjs-to-React-native-converter
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 💻 Usage

Option 1: Use the online converter
1. Visit [https://react-to-react-native.koyeb.app/](https://react-to-react-native.koyeb.app/)
2. Upload your React project ZIP file
3. Click "Convert Project"
4. Download the converted React Native project

Option 2: Local installation
1. Package your React project's source code into a ZIP file
2. Run the local server (`npm start`)
3. Visit `http://localhost:3000`
4. Upload your ZIP file
5. Download the converted project

## 🔄 Conversion Process

The converter handles:

- JSX element conversion (div → View, span → Text, etc.)
- Event handler mapping (onClick → onPress)
- CSS to StyleSheet conversion
- Library compatibility checks
- File structure reorganization

## ⚠️ Important Notes

1. **Manual Review Required**
   - Review the converted code before implementation
   - Some components may need manual adjustments
   - Complex CSS might need fine-tuning

2. **Unsupported Features**
   - Web-specific APIs
   - Direct DOM manipulation
   - CSS animations (need React Native Animated)
   - Some HTML elements

3. **Common Library Replacements**
   - react-router-dom → @react-navigation/native
   - material-ui → react-native-paper
   - react-helmet → react-native-head

## 🗺️ Component Mapping

| Web (React) | Mobile (React Native) |
|-------------|----------------------|
| div         | View                |
| span        | Text                |
| p           | Text                |
| button      | TouchableOpacity    |
| img         | Image               |
| h1-h6       | Text                |

## 🛠️ Troubleshooting

Common issues and solutions:

1. **Styling Issues**
   - React Native uses a subset of CSS
   - Replace unsupported styles with platform-specific alternatives
   - Use React Native's Flexbox for layouts

2. **Navigation Issues**
   - Implement @react-navigation/native
   - Replace browser routing with stack/tab navigation

3. **Platform-Specific Code**
   - Use Platform.select() for platform-specific logic
   - Create separate components when needed

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**Abdulrhman Hussein**
- GitHub: [@AbdulrhmanR91](https://github.com/AbdulrhmanR91)
- Project Repository: [Reactjs-To-React-Native](https://github.com/AbdulrhmanR91/Reactjs-to-React-native-converter)

## 🙏 Acknowledgments

- React Native community
- Babel team for AST transformation tools
- Contributors and testers

---

⭐️ If you find this project helpful, please give it a star on GitHub! ⭐️
