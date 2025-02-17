import fs from "fs-extra";
import path from "path";
import parser from "@babel/parser";
import traverseDefault from "@babel/traverse";
const traverse = traverseDefault.default;
import generatorDefault from "@babel/generator";
const generate = generatorDefault.default;
import css from "css";

const tagMap = {
  div: "View",
  span: "Text",
  p: "Text",
  button: "TouchableOpacity",
  img: "Image",
  h1: "Text",
  h2: "Text",
  h3: "Text",
};

const unsuitableLibraries = {
  "react-router-dom": {
    message: "react-router-dom is not compatible with React Native",
    replacement: "@react-navigation/native",
    details: "Use @react-navigation/native with @react-navigation/stack for navigation"
  },
  "react-helmet": {
    message: "react-helmet is web-only",
    replacement: "react-native-head",
    details: "Use react-native-head for app metadata"
  },
  "material-ui": {
    message: "Material-UI is not compatible with React Native",
    replacement: "react-native-paper",
    details: "Use react-native-paper for Material Design"
  },
  "@mui/material": {
    message: "MUI is not compatible with React Native",
    replacement: "react-native-paper",
    details: "Use react-native-paper for Material Design components"
  },
  "styled-components/web": {
    message: "styled-components/web is not compatible with React Native",
    replacement: "styled-components/native",
    details: "Use styled-components/native for styling React Native components"
  },
  "react-bootstrap": {
    message: "React Bootstrap is not compatible with React Native",
    replacement: "react-native-elements",
    details: "Use react-native-elements or react-native-paper for UI components"
  },
  "antd": {
    message: "Ant Design is not compatible with React Native",
    replacement: "@ant-design/react-native",
    details: "Use @ant-design/react-native for Ant Design mobile components"
  },
  "react-modal": {
    message: "react-modal is web-only",
    replacement: "react-native-modal",
    details: "Use react-native-modal for modal dialogs"
  },
  "react-select": {
    message: "react-select is web-only",
    replacement: "@react-native-picker/picker",
    details: "Use @react-native-picker/picker for dropdown selections"
  },
  "react-datepicker": {
    message: "react-datepicker is web-only",
    replacement: "@react-native-community/datetimepicker",
    details: "Use @react-native-community/datetimepicker for date picking"
  },
  "react-table": {
    message: "react-table is web-only",
    replacement: "react-native-table-component",
    details: "Use react-native-table-component for tables in React Native"
  },
  "react-icons": {
    message: "react-icons is web-only",
    replacement: "react-native-vector-icons",
    details: "Use react-native-vector-icons for icons in React Native"
  },
  "react-toastify": {
    message: "react-toastify is web-only",
    replacement: "react-native-toast-message",
    details: "Use react-native-toast-message for toast notifications"
  },
  "formik-mui": {
    message: "formik-mui is web-only",
    replacement: "formik",
    details: "Use plain formik with react-native-paper or react-native-elements form components"
  },
  "react-markdown": {
    message: "react-markdown is web-only",
    replacement: "react-native-markdown-display",
    details: "Use react-native-markdown-display for rendering markdown"
  },
  "react-syntax-highlighter": {
    message: "react-syntax-highlighter is web-only",
    replacement: "react-native-syntax-highlighter",
    details: "Use react-native-syntax-highlighter for code highlighting"
  },
  "chart.js": {
    message: "chart.js is web-only",
    replacement: "react-native-chart-kit",
    details: "Use react-native-chart-kit for charts and graphs"
  },

  "react-hook-form": {
    message: "react-hook-form needs adaptation for React Native",
    replacement: "react-hook-form",
    details: "react-hook-form works with React Native but needs different form components"
  },
  "@formik/web": {
    message: "@formik/web components are not compatible with React Native",
    replacement: "formik",
    details: "Use base formik with React Native components"
  },

  "redux-devtools-extension": {
    message: "redux-devtools-extension is web-only",
    replacement: "react-native-debugger",
    details: "Use React Native Debugger for Redux debugging"
  },


  "@emotion/styled": {
    message: "@emotion/styled is web-focused",
    replacement: "styled-components/native",
    details: "Use styled-components/native for React Native styling"
  },
  "jss": {
    message: "JSS is web-only",
    replacement: "react-native StyleSheet",
    details: "Use React Native's built-in StyleSheet API"
  },

  
  "react-spring": {
    message: "react-spring web version is not compatible",
    replacement: "@react-spring/native",
    details: "Use @react-spring/native for React Native animations"
  },
  "framer-motion": {
    message: "framer-motion is web-only",
    replacement: "react-native-reanimated",
    details: "Use react-native-reanimated for animations"
  },


  "react-image": {
    message: "react-image is web-only",
    replacement: "react-native-fast-image",
    details: "Use react-native-fast-image for better image handling"
  },
  "react-lazy-load-image-component": {
    message: "react-lazy-load-image-component is web-only",
    replacement: "react-native-fast-image",
    details: "Use react-native-fast-image with loading states"
  },

 
  "react-quill": {
    message: "react-quill is web-only",
    replacement: "react-native-pell-rich-editor",
    details: "Use react-native-pell-rich-editor for rich text editing"
  },
  "draft-js": {
    message: "draft-js is web-only",
    replacement: "react-native-rich-editor",
    details: "Use react-native-rich-editor for rich text editing"
  },

  
  "ag-grid-react": {
    message: "ag-grid-react is web-only",
    replacement: "react-native-table-component",
    details: "Use react-native-table-component or implement custom tables"
  },
  "@material-ui/x-grid": {
    message: "Material-UI X-Grid is web-only",
    replacement: "react-native-table-component",
    details: "Use react-native-table-component for tables"
  },

 
  "@material-ui/pickers": {
    message: "Material-UI pickers are web-only",
    replacement: "@react-native-community/datetimepicker",
    details: "Use @react-native-community/datetimepicker for date/time selection"
  },
  "react-big-calendar": {
    message: "react-big-calendar is web-only",
    replacement: "react-native-calendars",
    details: "Use react-native-calendars for calendar functionality"
  },

  
  "react-dropzone": {
    message: "react-dropzone is web-only",
    replacement: "react-native-document-picker",
    details: "Use react-native-document-picker for file selection"
  },
  "react-file-upload": {
    message: "react-file-upload is web-only",
    replacement: "react-native-image-picker",
    details: "Use react-native-image-picker or react-native-document-picker"
  },

  "recharts": {
    message: "recharts is web-only",
    replacement: "react-native-svg-charts",
    details: "Use react-native-svg-charts for charts and graphs"
  },
  "victory": {
    message: "victory web components are not compatible",
    replacement: "victory-native",
    details: "Use victory-native for charts and graphs"
  },

  "react-google-maps": {
    message: "react-google-maps is web-only",
    replacement: "react-native-maps",
    details: "Use react-native-maps for map integration"
  },
  "google-map-react": {
    message: "google-map-react is web-only",
    replacement: "react-native-maps",
    details: "Use react-native-maps for map functionality"
  }
};

export const convertFile = (filePath, inputDir, outputDir) => {
  if (!filePath.endsWith(".js") && !filePath.endsWith(".jsx")) return;

  const code = fs.readFileSync(filePath, "utf-8");
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "classProperties"],
  });

  traverse(ast, {
    JSXElement(path) {
      const openingEl = path.node.openingElement;
      if (openingEl.name && openingEl.name.type === "JSXIdentifier" && tagMap[openingEl.name.name]) {
        const originalTag = openingEl.name.name;
        openingEl.name.name = tagMap[originalTag];
        if (path.node.closingElement?.name?.type === "JSXIdentifier") {
          path.node.closingElement.name.name = tagMap[originalTag];
        }
      }

      openingEl.attributes.forEach((attr) => {
        if (attr.type !== "JSXAttribute") return;
        if (attr.name?.name === "onClick") attr.name.name = "onPress";
        if (attr.name?.name === "className") attr.name.name = "style";
      });
    },

    ImportDeclaration(path) {
      const importSource = path.node.source.value;
      if (unsuitableLibraries[importSource]) {
        const { message, replacement, details } = unsuitableLibraries[importSource];
        path.addComment("leading", `${message}\nUse: ${replacement}\n${details}`);
        path.remove();
        return;
      }
      if (importSource.endsWith(".css")) path.remove();
    },
  });

  const outputCode = generate(ast, {}).code;
  const relativePath = path.relative(inputDir, filePath);
  const outputFilePath = path.join(outputDir, relativePath).replace(/\.(js|jsx)$/, ".tsx");
  fs.ensureDirSync(path.dirname(outputFilePath));
  fs.writeFileSync(outputFilePath, outputCode, "utf-8");
};

export const convertStyles = (cssFilePath, inputDir, outputDir) => {
  if (!fs.existsSync(cssFilePath)) return;

  const cssCode = fs.readFileSync(cssFilePath, "utf-8");
  let parsedCSS;
  try {
    parsedCSS = css.parse(cssCode);
  } catch (error) {
    console.error(`Error parsing CSS file ${cssFilePath}:`, error);
    return;
  }
  let styles = {};

  if (parsedCSS.stylesheet?.rules) {
    parsedCSS.stylesheet.rules.forEach((rule) => {
      if (rule.type === "rule" && rule.selectors?.[0].startsWith(".")) {
        const className = rule.selectors[0].replace(".", "");
        styles[className] = {};
        rule.declarations?.forEach((decl) => {
          if (decl.type === "declaration") {
            const prop = decl.property.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
            styles[className][prop] = decl.value;
          }
        });
      }
    });
  }

  const relativePath = path.relative(inputDir, cssFilePath);
  const outputStylePath = path.join(outputDir, relativePath.replace(/\.css$/, ".styles.js"));
  fs.ensureDirSync(path.dirname(outputStylePath));
  fs.writeFileSync(outputStylePath, `import { StyleSheet } from "react-native";\n\nexport default StyleSheet.create(${JSON.stringify(styles, null, 2)});\n`);
};

export const convertProject = (inputDir, outputDir) => {
  fs.readdirSync(inputDir).forEach((file) => {
    const filePath = path.join(inputDir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      convertProject(filePath, outputDir);
    } else if (file.endsWith(".js") || file.endsWith(".jsx")) {
      convertFile(filePath, inputDir, outputDir);
    } else if (file.endsWith(".css")) {
      convertStyles(filePath, inputDir, outputDir);
    }
  });
};
