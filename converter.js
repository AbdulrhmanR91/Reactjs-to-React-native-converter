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
