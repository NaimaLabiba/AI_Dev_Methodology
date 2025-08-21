# BDD Diagramming Interface

A comprehensive web-based diagramming tool focused on Behavior-Driven Development (BDD) methodology, featuring auto-rendering capabilities and interactive canvas-based diagram creation.

##  Core Features

### Auto-Rendering System
- **Instant Diagram Generation**: Automatic rendering of diagrams immediately after markdown import
- **Loading Indicators**: Visual feedback during processing with success notifications
- **File-Only Import**: Streamlined workflow eliminating text area interactions
- **Smart Processing**: Intelligent parsing of BDD specifications into visual diagrams

### BDD-Focused Interface
- **Methodology Integration**: Built-in BDD methodology header and workflow support
- **Flow & Sequence Diagrams**: Support for both BDD flow and sequence diagram types
- **Business Outcomes Visualization**: Clear representation of business value and outcomes
- **Horizontal Layout Optimization**: Precise coordinate mapping for professional diagram layouts

### Interactive Canvas System
- **HTML5 Canvas Rendering**: High-performance canvas-based diagram rendering
- **Pan & Zoom Controls**: Smooth navigation with fit-to-screen functionality
- **Real-time Manipulation**: Drag, drop, resize, and connect elements dynamically
- **Visual Feedback**: Selection handles, connection points, and hover effects

### Comprehensive Export System
- **5 Export Formats**: 
  - Mermaid syntax
  - Human-readable markdown
  - PNG images
  - SVG vectors
  - JSON data
- **Modal-Based Interface**: Clean import/export workflow with file upload
- **Cross-Format Compatibility**: Seamless conversion between different diagram formats

##  Technology Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Canvas**: HTML5 Canvas API for high-performance rendering
- **Architecture**: Object-oriented design with BDDDiagrammingInterface and BDDMarkdownParser classes
- **Server**: Node.js HTTP server (port 4003)
- **Styling**: Modern CSS with BDD-focused design patterns

##  Project Structure

```
diagramming-interface/
├── bdd-interface.html           # Main BDD diagramming interface
├── bdd-script-complete.js       # Complete BDD functionality implementation
├── bdd-server.js               # Node.js server (port 4003)
├── bdd-styles.css              # BDD-focused styling
├── README.md                   # This documentation
└── db/                         # BDD methodology database
    └── app_methodology/
        ├── bdd.md              # BDD specification and workflows
        ├── ddd.md              # Domain-Driven Design integration
        ├── sdd.md              # Specification-Driven Development
        ├── tdd.md              # Test-Driven Development
        ├── input_files/        # Original methodology input files
        │   ├── bdd_flow.md     # BDD flow specifications
        │   ├── bdd_seq.md      # BDD sequence specifications
        │   └── ...             # Additional methodology files
        └── mermaid_files/      # Mermaid syntax versions
            ├── bdd_flow_mermaid.md
            ├── bdd_seq_mermaid.md
            └── ...             # Additional mermaid files
```

##  Getting Started

### Prerequisites

Before running the BDD Diagramming Interface, ensure you have the following installed:

#### Required Software
- **Node.js** (version 14.0 or higher)
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`
- **Modern Web Browser** (Chrome, Firefox, Safari, or Edge)
  - Required for HTML5 Canvas support and ES6+ JavaScript features

#### System Requirements
- **Operating System**: Windows, macOS, or Linux
- **RAM**: Minimum 4GB (8GB recommended for large diagrams)
- **Storage**: At least 100MB free space
- **Network**: Internet connection for initial setup (optional for offline use)

### Installation Steps

#### Step 1: Download/Clone the Project
```bash
# If using Git
git clone <your-repository-url>
cd diagramming-interface

# Or download and extract the ZIP file, then navigate to the folder
cd path/to/diagramming-interface
```

#### Step 2: Verify Node.js Installation
```bash
# Check Node.js version (should be 14.0+)
node --version

# Check npm version
npm --version
```

#### Step 3: Navigate to Project Directory
```bash
# Ensure you're in the correct directory
cd diagramming-interface
ls -la  # Should show bdd-server.js, bdd-interface.html, etc.
```

### Running the Application

#### Start the BDD Server
```bash
# Navigate to project directory (if not already there)
cd diagramming-interface

# Start the BDD server
node bdd-server.js
```

#### Expected Server Output
```
🟢 BDD Diagramming Interface Server running at:
   http://localhost:4003
   http://127.0.0.1:4003

🎯 Press Ctrl+C to stop the server
```

#### Access the Application
1. **Open your web browser**
2. **Navigate to**: `http://localhost:4003`
3. **The BDD Diagramming Interface should load automatically**

### Troubleshooting

#### Common Issues and Solutions

**Port Already in Use Error**
```bash
# Error: EADDRINUSE: address already in use :::4003
# Solution 1: Kill existing process
netstat -ano | findstr :4003  # Find the PID
taskkill /PID <PID> /F         # Kill the process

# Solution 2: Use different port (modify bdd-server.js)
# Change PORT = 4003 to PORT = 4004 or another available port
```

**Node.js Not Found**
```bash
# Install Node.js from https://nodejs.org/
# Restart your terminal/command prompt after installation
# Verify: node --version
```

**Permission Denied (Linux/macOS)**
```bash
# If you get permission errors, try:
sudo node bdd-server.js
# Or fix file permissions:
chmod +x bdd-server.js
```

**Browser Compatibility Issues**
- Use a modern browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Enable JavaScript in your browser settings
- Clear browser cache if experiencing issues

### First Time Setup

#### 1. Test the Server
- Start the server using the steps above
- Verify you see the success message
- Open `http://localhost:4003` in your browser

#### 2. Test Core Functionality
- **Import Test**: Try importing a sample BDD markdown file
- **Canvas Test**: Verify you can pan and zoom the canvas
- **Export Test**: Test exporting in different formats

#### 3. Verify File Structure
Ensure your project structure matches:
```
diagramming-interface/
├── bdd-interface.html     ✓ Main interface file
├── bdd-script-complete.js ✓ Core functionality
├── bdd-server.js         ✓ Server file
├── bdd-styles.css        ✓ Styling
└── db/app_methodology/   ✓ BDD methodology files
```

### Development Environment Setup

#### For Development/Customization
```bash
# Optional: Install development tools
npm init -y                    # Initialize package.json
npm install --save-dev nodemon # Auto-restart server on changes

# Run with auto-restart (if nodemon installed)
npx nodemon bdd-server.js

# Or use the standard approach
node bdd-server.js
```

#### Environment Variables (Optional)
```bash
# Set custom port (Windows)
set PORT=4004 && node bdd-server.js

# Set custom port (Linux/macOS)
PORT=4004 node bdd-server.js
```

### Quick Start Checklist

- [ ] Node.js installed (version 14.0+)
- [ ] Project files downloaded/cloned
- [ ] Terminal/Command prompt opened
- [ ] Navigated to `diagramming-interface` directory
- [ ] Ran `node bdd-server.js`
- [ ] Saw success message with server URLs
- [ ] Opened `http://localhost:4003` in browser
- [ ] BDD Diagramming Interface loaded successfully
- [ ] Tested import/export functionality

### Next Steps

Once the application is running:
1. **Import a BDD file** to test auto-rendering
2. **Explore the canvas** with pan and zoom controls
3. **Try different export formats** to understand capabilities
4. **Review the methodology files** in `db/app_methodology/`

##  How to Use

### Auto-Rendering Workflow
1. **Import File**: Click Import button and select your BDD markdown file
2. **Auto-Processing**: System automatically processes and renders the diagram
3. **Visual Feedback**: Loading indicator shows processing status
4. **Success Notification**: Confirmation when diagram is ready
5. **Interactive Canvas**: Pan, zoom, and interact with the generated diagram

### Export Options
1. **Select Format**: Choose from 5 available export formats
2. **Generate Export**: System processes current diagram state
3. **Download**: Automatic download of exported file
4. **Cross-Format**: Switch between formats as needed

### Canvas Interaction
- **Pan**: Click and drag to move around the canvas
- **Zoom**: Use zoom controls or mouse wheel
- **Select**: Click elements to select and modify
- **Connect**: Use connection points to link diagram elements

##  Architecture

### Core Classes

#### `BDDDiagrammingInterface`
Main application class handling:
- Auto-rendering workflow management
- Canvas rendering and interaction
- Import/export functionality
- BDD methodology integration

#### `BDDMarkdownParser`
Specialized parser for BDD specifications:
- Markdown to diagram conversion
- Horizontal layout calculation
- Element positioning and connections
- Business outcome extraction

##  BDD Integration

### Methodology Support
- **Flow Diagrams**: Visual representation of BDD workflows
- **Sequence Diagrams**: Step-by-step BDD process visualization
- **Business Outcomes**: Clear mapping of features to business value
- **Specification Parsing**: Intelligent interpretation of BDD syntax

### Auto-Rendering Features
- **Instant Visualization**: Immediate diagram generation from specifications
- **Layout Optimization**: Automatic horizontal positioning for readability
- **Connection Management**: Smart linking of related BDD elements
- **Success Feedback**: Clear indication of successful processing

##  Useful Links

<!-- Links to be added -->

##  Customization

### Adding New BDD Templates
1. Create new specification files in `db/app_methodology/input_files/`
2. Generate corresponding mermaid versions in `mermaid_files/`
3. Update parser logic for new BDD patterns
4. Test auto-rendering with new templates

### Extending Export Formats
1. Add new export method to `BDDDiagrammingInterface`
2. Implement format-specific conversion logic
3. Update export modal with new option
4. Test cross-format compatibility


##  License

Created for BDD methodology education and practical application in software development workflows.

---
