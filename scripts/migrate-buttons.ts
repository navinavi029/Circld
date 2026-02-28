import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { auditButtons, type ButtonAuditResult } from './audit-buttons';

/**
 * Button Migration Helper Script
 * 
 * This script assists with converting native button elements to the Button component,
 * providing suggestions for variant mapping and flagging complex cases for manual review.
 * 
 * Features:
 * - Analyzes native button styling and suggests appropriate Button variants
 * - Preserves all functionality (onClick handlers, disabled states, aria attributes)
 * - Maps inline styles and className to Button variants
 * - Flags complex cases that need manual review
 * 
 * Validates Requirements: 5.1, 5.3, 5.4
 */

interface MigrationSuggestion {
  location: {
    file: string;
    line: number;
    column: number;
  };
  originalCode: string;
  suggestedCode: string;
  suggestedVariant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  manualReviewNeeded: boolean;
  preservedProps: string[];
  warnings: string[];
}

interface MigrationReport {
  totalNativeButtons: number;
  highConfidenceMigrations: number;
  mediumConfidenceMigrations: number;
  lowConfidenceMigrations: number;
  manualReviewRequired: number;
  suggestions: MigrationSuggestion[];
}

/**
 * Analyzes button styling to suggest the most appropriate Button variant
 */
function suggestVariant(props: Record<string, unknown>): {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
} {
  const className = String(props.className || props.class || '').toLowerCase();
  const style = props.style ? String(props.style) : '';
  const type = String(props.type || '').toLowerCase();
  
  // Check for danger/destructive patterns
  if (
    className.includes('danger') ||
    className.includes('delete') ||
    className.includes('remove') ||
    className.includes('destructive') ||
    className.includes('error') ||
    style.includes('red') ||
    style.includes('#dc2626') ||
    style.includes('#ef4444')
  ) {
    return {
      variant: 'danger',
      confidence: 'high',
      reasoning: 'Detected danger/destructive styling patterns (red colors, danger/delete/remove classes)',
    };
  }
  
  // Check for outline patterns
  if (
    className.includes('outline') ||
    className.includes('border') && !className.includes('border-none') ||
    style.includes('border') && style.includes('transparent')
  ) {
    return {
      variant: 'outline',
      confidence: 'high',
      reasoning: 'Detected outline styling (border with transparent or light background)',
    };
  }
  
  // Check for ghost/text-like patterns
  if (
    className.includes('ghost') ||
    className.includes('text-only') ||
    className.includes('link') ||
    style.includes('background: transparent') ||
    style.includes('background:transparent') ||
    (style.includes('background') && style.includes('none'))
  ) {
    return {
      variant: 'ghost',
      confidence: 'high',
      reasoning: 'Detected ghost/text-like styling (transparent background, minimal styling)',
    };
  }
  
  // Check for secondary patterns
  if (
    className.includes('secondary') ||
    className.includes('accent') ||
    className.includes('alternative') ||
    style.includes('gray') ||
    style.includes('#6b7280')
  ) {
    return {
      variant: 'secondary',
      confidence: 'medium',
      reasoning: 'Detected secondary styling patterns (secondary/accent classes, gray colors)',
    };
  }
  
  // Check for primary patterns (default for submit buttons)
  if (
    className.includes('primary') ||
    className.includes('cta') ||
    className.includes('main') ||
    type === 'submit' ||
    style.includes('blue') ||
    style.includes('#3b82f6') ||
    style.includes('#10b981')
  ) {
    return {
      variant: 'primary',
      confidence: 'high',
      reasoning: 'Detected primary styling patterns (primary classes, submit type, primary colors)',
    };
  }
  
  // Default to primary with low confidence if no clear patterns
  return {
    variant: 'primary',
    confidence: 'low',
    reasoning: 'No clear styling patterns detected, defaulting to primary variant (manual review recommended)',
  };
}

/**
 * Extracts props that should be preserved during migration
 */
function extractPreservedProps(props: Record<string, unknown>): {
  preserved: string[];
  warnings: string[];
} {
  const preserved: string[] = [];
  const warnings: string[] = [];
  
  // Props that should always be preserved
  const preserveProps = [
    'onClick',
    'onSubmit',
    'disabled',
    'type',
    'aria-label',
    'aria-describedby',
    'aria-pressed',
    'aria-expanded',
    'aria-controls',
    'aria-haspopup',
    'id',
    'name',
    'value',
    'form',
    'formAction',
    'formMethod',
    'formTarget',
    'formNoValidate',
    'formEncType',
    'tabIndex',
    'title',
    'data-testid',
  ];
  
  Object.keys(props).forEach(key => {
    // Skip styling props (will be replaced by variant)
    if (key === 'className' || key === 'class' || key === 'style') {
      return;
    }
    
    // Skip spread attributes (need manual review)
    if (key === '...spread') {
      warnings.push('Contains spread attributes - manual review needed to preserve all props');
      return;
    }
    
    // Check if prop should be preserved
    if (preserveProps.includes(key) || key.startsWith('data-') || key.startsWith('aria-')) {
      preserved.push(key);
    } else {
      warnings.push(`Uncommon prop "${key}" found - verify if it should be preserved`);
    }
  });
  
  return { preserved, warnings };
}

/**
 * Generates the suggested Button component code
 */
function generateButtonCode(
  props: Record<string, unknown>,
  variant: string,
  preservedProps: string[],
  children: string
): string {
  const propsArray: string[] = [];
  
  // Add variant if not primary (default)
  if (variant !== 'primary') {
    propsArray.push(`variant="${variant}"`);
  }
  
  // Add preserved props
  preservedProps.forEach(key => {
    const value = props[key];
    if (value === true) {
      propsArray.push(key);
    } else if (typeof value === 'string' && !value.includes('{')) {
      propsArray.push(`${key}="${value}"`);
    } else {
      propsArray.push(`${key}={${value}}`);
    }
  });
  
  const propsString = propsArray.length > 0 ? ' ' + propsArray.join(' ') : '';
  
  if (children.trim()) {
    return `<Button${propsString}>${children}</Button>`;
  } else {
    return `<Button${propsString} />`;
  }
}

/**
 * Reads the source code around a button to extract its content
 */
function extractButtonContent(filePath: string, line: number): string {
  try {
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const lines = sourceCode.split('\n');
    
    // Get the line with the button (0-indexed)
    const buttonLine = lines[line - 1] || '';
    
    // Simple extraction: look for content between > and </button>
    const match = buttonLine.match(/>([^<]*)</);
    if (match) {
      return match[1].trim();
    }
    
    // If button spans multiple lines, try to find closing tag
    let content = '';
    let foundOpening = false;
    for (let i = line - 1; i < Math.min(line + 5, lines.length); i++) {
      const currentLine = lines[i];
      if (!foundOpening && currentLine.includes('<button')) {
        foundOpening = true;
        const afterOpening = currentLine.split('>').slice(1).join('>');
        content += afterOpening;
      } else if (foundOpening) {
        if (currentLine.includes('</button>')) {
          content += currentLine.split('</button>')[0];
          break;
        }
        content += currentLine;
      }
    }
    
    return content.trim();
  } catch (error) {
    return '';
  }
}

/**
 * Generates migration suggestions for native buttons
 */
function generateMigrationSuggestions(auditResults: ButtonAuditResult[]): MigrationSuggestion[] {
  const suggestions: MigrationSuggestion[] = [];
  
  // Filter only native buttons
  const nativeButtons = auditResults.filter(r => r.type === 'Native_Button');
  
  nativeButtons.forEach(button => {
    const { variant, confidence, reasoning } = suggestVariant(button.props);
    const { preserved, warnings } = extractPreservedProps(button.props);
    
    // Extract button content
    const children = extractButtonContent(button.location.file, button.location.line);
    
    // Generate suggested code
    const suggestedCode = generateButtonCode(button.props, variant, preserved, children);
    
    // Determine if manual review is needed
    const manualReviewNeeded = 
      confidence === 'low' ||
      warnings.length > 0 ||
      button.styling === 'inline' ||
      Object.keys(button.props).includes('...spread');
    
    suggestions.push({
      location: button.location,
      originalCode: `<button ${Object.entries(button.props).map(([k, v]) => 
        v === true ? k : `${k}="${v}"`
      ).join(' ')}>${children}</button>`,
      suggestedCode,
      suggestedVariant: variant,
      confidence,
      reasoning,
      manualReviewNeeded,
      preservedProps: preserved,
      warnings,
    });
  });
  
  return suggestions;
}

/**
 * Main migration analysis function
 */
function analyzeMigration(rootDir: string): MigrationReport {
  console.log('Starting migration analysis...');
  console.log(`Scanning directory: ${rootDir}\n`);
  
  // Run audit to get all buttons
  const auditReport = auditButtons(rootDir);
  
  // Generate migration suggestions
  const suggestions = generateMigrationSuggestions(auditReport.results);
  
  // Calculate statistics
  const highConfidence = suggestions.filter(s => s.confidence === 'high').length;
  const mediumConfidence = suggestions.filter(s => s.confidence === 'medium').length;
  const lowConfidence = suggestions.filter(s => s.confidence === 'low').length;
  const manualReview = suggestions.filter(s => s.manualReviewNeeded).length;
  
  return {
    totalNativeButtons: auditReport.nativeButtons,
    highConfidenceMigrations: highConfidence,
    mediumConfidenceMigrations: mediumConfidence,
    lowConfidenceMigrations: lowConfidence,
    manualReviewRequired: manualReview,
    suggestions,
  };
}

/**
 * Displays the migration report in a readable format
 */
function displayMigrationReport(report: MigrationReport): void {
  console.log('='.repeat(70));
  console.log('BUTTON MIGRATION ANALYSIS REPORT');
  console.log('='.repeat(70));
  console.log(`\nTotal Native Buttons Found: ${report.totalNativeButtons}`);
  console.log(`\nMigration Confidence Breakdown:`);
  console.log(`  ✓ High Confidence: ${report.highConfidenceMigrations}`);
  console.log(`  ~ Medium Confidence: ${report.mediumConfidenceMigrations}`);
  console.log(`  ⚠ Low Confidence: ${report.lowConfidenceMigrations}`);
  console.log(`\n⚠ Manual Review Required: ${report.manualReviewRequired}`);
  console.log('\n' + '='.repeat(70));
  console.log('MIGRATION SUGGESTIONS');
  console.log('='.repeat(70) + '\n');
  
  // Group by file
  const byFile = new Map<string, MigrationSuggestion[]>();
  report.suggestions.forEach(suggestion => {
    const existing = byFile.get(suggestion.location.file) || [];
    existing.push(suggestion);
    byFile.set(suggestion.location.file, existing);
  });
  
  byFile.forEach((suggestions, file) => {
    console.log(`\n📁 ${file}`);
    suggestions.forEach(suggestion => {
      const confidenceIcon = 
        suggestion.confidence === 'high' ? '✓' :
        suggestion.confidence === 'medium' ? '~' : '⚠';
      const reviewIcon = suggestion.manualReviewNeeded ? ' 🔍' : '';
      
      console.log(`\n  ${confidenceIcon} Line ${suggestion.location.line}${reviewIcon}`);
      console.log(`     Suggested Variant: ${suggestion.suggestedVariant} (${suggestion.confidence} confidence)`);
      console.log(`     Reasoning: ${suggestion.reasoning}`);
      
      if (suggestion.warnings.length > 0) {
        console.log(`     ⚠ Warnings:`);
        suggestion.warnings.forEach(warning => {
          console.log(`       - ${warning}`);
        });
      }
      
      console.log(`\n     Original:`);
      console.log(`       ${suggestion.originalCode}`);
      console.log(`\n     Suggested:`);
      console.log(`       ${suggestion.suggestedCode}`);
      
      if (suggestion.preservedProps.length > 0) {
        console.log(`\n     Preserved Props: ${suggestion.preservedProps.join(', ')}`);
      }
    });
  });
  
  console.log('\n' + '='.repeat(70));
  console.log('\n💡 Next Steps:');
  console.log('   1. Review high-confidence suggestions and apply migrations');
  console.log('   2. Manually review medium/low confidence suggestions');
  console.log('   3. Test functionality after each migration');
  console.log('   4. Ensure Button component is imported in each file');
  console.log('   5. Run tests to verify no regressions\n');
}

/**
 * Saves the migration report to a JSON file
 */
function saveMigrationReport(report: MigrationReport, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`✓ Migration report saved to: ${outputPath}\n`);
}

// Main execution
const args = process.argv.slice(2);
if (args.length > 0 || process.argv[1]?.includes('migrate-buttons')) {
  const rootDir = args[0] || './src';
  const outputPath = args[1] || './button-migration-report.json';
  
  const report = analyzeMigration(rootDir);
  displayMigrationReport(report);
  saveMigrationReport(report, outputPath);
}

export { analyzeMigration, generateMigrationSuggestions, suggestVariant, type MigrationReport, type MigrationSuggestion };
