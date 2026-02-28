import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Button Audit Tool
 * 
 * This script scans the codebase for Button components and native button elements,
 * providing a comprehensive inventory for consistency improvements.
 * 
 * Features:
 * - Detects <Button> component usage and extracts variant props
 * - Detects native <button> elements and extracts styling information
 * - Captures location data (file path, line number, column number)
 * - Categorizes styling approach (component variant, inline styles, className)
 * 
 * Validates Requirements: 1.1, 1.2, 1.3, 1.4
 */

interface ButtonAuditResult {
  location: {
    file: string;
    line: number;
    column: number;
  };
  type: 'Button_Component' | 'Native_Button';
  variant?: string;
  styling: 'component' | 'inline' | 'className';
  props: Record<string, unknown>;
}

interface AuditReport {
  totalButtons: number;
  componentButtons: number;
  nativeButtons: number;
  results: ButtonAuditResult[];
}

/**
 * Recursively traverses directories to find all .tsx and .jsx files
 */
function findReactFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, build, and hidden directories
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'build') {
        findReactFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Extracts props from a JSX element as a key-value object
 * Enhanced to capture variant props and styling information comprehensively
 */
function extractProps(node: ts.JsxOpeningLikeElement): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  node.attributes.properties.forEach(attr => {
    if (ts.isJsxAttribute(attr)) {
      const name = attr.name.getText();
      
      if (attr.initializer) {
        if (ts.isStringLiteral(attr.initializer)) {
          props[name] = attr.initializer.text;
        } else if (ts.isJsxExpression(attr.initializer)) {
          // For expressions, store the text representation
          const expression = attr.initializer.expression;
          if (expression) {
            props[name] = expression.getText();
          } else {
            props[name] = true;
          }
        }
      } else {
        // Boolean prop without value (e.g., disabled)
        props[name] = true;
      }
    } else if (ts.isJsxSpreadAttribute(attr)) {
      props['...spread'] = attr.expression.getText();
    }
  });

  return props;
}

/**
 * Determines the styling approach used by a button element
 * Enhanced to better categorize component variants, inline styles, and className usage
 */
function determineStyling(props: Record<string, unknown>, isComponent: boolean): 'component' | 'inline' | 'className' {
  if (isComponent) {
    // Button component uses variant prop for styling
    return 'component';
  }
  
  // For native buttons, check styling approach
  if (props.style) {
    return 'inline';
  }
  
  if (props.className || props.class) {
    return 'className';
  }
  
  // If no explicit styling found, still categorize as className
  // (may have default browser styles or inherited styles)
  return 'className';
}

/**
 * Parses a single file and extracts button information
 * Enhanced to comprehensively detect Button components and native buttons with full categorization
 */
function parseFile(filePath: string): ButtonAuditResult[] {
  const results: ButtonAuditResult[] = [];
  
  try {
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    function visit(node: ts.Node) {
      // Check for JSX elements
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        const openingElement = ts.isJsxElement(node) 
          ? node.openingElement 
          : node;
        
        const tagName = openingElement.tagName.getText(sourceFile);
        
        // Check if it's a Button component or native button
        if (tagName === 'Button' || tagName === 'button') {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(
            openingElement.getStart(sourceFile)
          );
          
          const props = extractProps(openingElement);
          const isComponent = tagName === 'Button';
          
          // Extract variant for Button components
          const variant = isComponent && props.variant 
            ? String(props.variant).replace(/['"]/g, '') // Remove quotes if present
            : undefined;
          
          results.push({
            location: {
              file: filePath,
              line: line + 1, // Convert to 1-based line numbers
              column: character + 1,
            },
            type: isComponent ? 'Button_Component' : 'Native_Button',
            variant,
            styling: determineStyling(props, isComponent),
            props,
          });
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error);
  }

  return results;
}

/**
 * Main audit function that scans the entire codebase
 */
function auditButtons(rootDir: string): AuditReport {
  console.log('Starting button audit...');
  console.log(`Scanning directory: ${rootDir}\n`);

  const reactFiles = findReactFiles(rootDir);
  console.log(`Found ${reactFiles.length} React files to analyze\n`);

  const allResults: ButtonAuditResult[] = [];

  reactFiles.forEach(file => {
    const results = parseFile(file);
    allResults.push(...results);
  });

  const componentButtons = allResults.filter(r => r.type === 'Button_Component').length;
  const nativeButtons = allResults.filter(r => r.type === 'Native_Button').length;

  const report: AuditReport = {
    totalButtons: allResults.length,
    componentButtons,
    nativeButtons,
    results: allResults,
  };

  return report;
}

/**
 * Formats and displays the audit report
 */
function displayReport(report: AuditReport): void {
  console.log('='.repeat(60));
  console.log('BUTTON AUDIT REPORT');
  console.log('='.repeat(60));
  console.log(`\nTotal Buttons Found: ${report.totalButtons}`);
  console.log(`  - Button Components: ${report.componentButtons}`);
  console.log(`  - Native Buttons: ${report.nativeButtons}`);
  console.log('\n' + '='.repeat(60));
  console.log('DETAILED RESULTS');
  console.log('='.repeat(60) + '\n');

  // Group by file
  const byFile = new Map<string, ButtonAuditResult[]>();
  report.results.forEach(result => {
    const existing = byFile.get(result.location.file) || [];
    existing.push(result);
    byFile.set(result.location.file, existing);
  });

  byFile.forEach((results, file) => {
    console.log(`\n📁 ${file}`);
    results.forEach(result => {
      const icon = result.type === 'Button_Component' ? '✓' : '⚠';
      const variant = result.variant ? ` (variant: ${result.variant})` : '';
      console.log(`  ${icon} Line ${result.location.line}: ${result.type}${variant}`);
      console.log(`     Styling: ${result.styling}`);
      if (Object.keys(result.props).length > 0) {
        console.log(`     Props: ${JSON.stringify(result.props, null, 2).split('\n').join('\n     ')}`);
      }
    });
  });

  console.log('\n' + '='.repeat(60));
}

/**
 * Saves the audit report to a JSON file
 */
function saveReport(report: AuditReport, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n✓ Report saved to: ${outputPath}`);
}

// Main execution - simplified for ES modules
const args = process.argv.slice(2);
if (args.length > 0 || process.argv[1]?.includes('audit-buttons')) {
  const rootDir = args[0] || './src';
  const outputPath = args[1] || './button-audit-report.json';

  const report = auditButtons(rootDir);
  displayReport(report);
  saveReport(report, outputPath);
}

export { auditButtons, parseFile, findReactFiles, type AuditReport, type ButtonAuditResult };
