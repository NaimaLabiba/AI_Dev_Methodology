# Diagramming Interface with Methodology Toggle System

A comprehensive web-based diagramming tool similar to Lucidchart, featuring drag-and-drop functionality and an innovative methodology toggle system that demonstrates different software development approaches.

## 🚀 Features

### Core Diagramming Features
- **Drag & Drop Interface**: Intuitive shape creation by dragging from toolbox or clicking
- **Multiple Shape Types**: 
  - Basic shapes (Rectangle, Circle, Diamond, Triangle)
  - Flowchart elements (Process, Decision, Start/End)
  - Tools (Text, Arrow)
- **Interactive Canvas**: 
  - Zoom in/out and reset zoom
  - Grid background for precise alignment
  - Real-time element count and zoom level display
- **Shape Manipulation**:
  - Select, move, resize elements
  - Visual selection handles and connection points
  - Property editing (colors, text, size, position)
- **Connection System**: Connect shapes with arrows using connection points
- **File Operations**: New, Save (JSON), Export (PNG)
- **Undo/Redo**: Full history management with 50-step limit
- **Keyboard Shortcuts**: Delete, Escape, Ctrl+Z/Y, Ctrl+D

### 🎯 Methodology Toggle System
A unique educational feature that demonstrates different software development methodologies:

1. **Manual Development** - Traditional ad-hoc approach
2. **Test-Driven Development (TDD)** - Test-first development cycle
3. **Behavior-Driven Development (BDD)** - Behavior specification approach
4. **Domain-Driven Design (DDD)** - Domain-focused architecture
5. **Specification-Driven Development (SDD)** - Formal specification approach

Each methodology includes:
- Detailed implementation strategies
- Code examples specific to diagramming interfaces
- Pros and cons analysis
- Best practices and workflows

## 🛠️ Technology Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Canvas**: HTML5 Canvas API for rendering
- **Architecture**: Object-oriented design with modular classes
- **Server**: Node.js HTTP server (for CORS resolution)
- **Styling**: Modern CSS with gradients, animations, and responsive design

## 📁 Project Structure

```
diagramming-interface/
├── index.html              # Main application interface
├── styles.css              # Complete styling and responsive design
├── script.js               # Core diagramming functionality + methodology manager
├── server.js               # Node.js HTTP server
├── server.py               # Python HTTP server (alternative)
├── README.md               # This documentation
└── db/                     # Methodology documentation
    ├── manual.md           # Manual Development approach
    ├── tdd.md              # Test-Driven Development
    ├── bdd.md              # Behavior-Driven Development
    ├── ddd.md              # Domain-Driven Design
    └── sdd.md              # Specification-Driven Development
```

## 🚀 Getting Started

### Option 1: Using Node.js Server (Recommended)
```bash
# Navigate to project directory
cd diagramming-interface

# Start the server
node server.js

# Open browser and go to:
# http://localhost:8000/index.html
```

### Option 2: Using Python Server
```bash
# Navigate to project directory
cd diagramming-interface

# Start the server
python server.py

# Open browser and go to:
# http://localhost:8000/index.html
```

### Option 3: Direct File Access
Open `index.html` directly in your browser (methodology viewer may have CORS limitations).

## 🎮 How to Use

### Creating Diagrams
1. **Add Shapes**: Drag shapes from the left toolbox to the canvas or click on shapes
2. **Select Elements**: Click on any shape to select it
3. **Edit Properties**: Use the right panel to modify colors, text, size, and position
4. **Create Connections**: Click on red connection points and drag to another shape
5. **Move Elements**: Drag selected shapes around the canvas
6. **Delete Elements**: Select and press Delete key or use the Delete button

### Using the Methodology System
1. **Select Methodology**: Use the dropdown in the top toolbar
2. **View Details**: Click the "View" button to open the methodology modal
3. **Learn Approaches**: Read about different development methodologies
4. **Compare Methods**: Switch between methodologies to see different approaches

### Keyboard Shortcuts
- `Delete` - Delete selected element
- `Escape` - Deselect all elements
- `Ctrl+Z` - Undo last action
- `Ctrl+Y` - Redo last action
- `Ctrl+D` - Duplicate selected element

## 🏗️ Architecture

### Core Classes

#### `DiagrammingInterface`
Main application class handling:
- Canvas management and rendering
- Event handling (mouse, keyboard)
- Element creation and manipulation
- History management
- File operations

#### `MethodologyManager`
Handles the methodology toggle system:
- Modal display and management
- Markdown content loading and parsing
- Methodology switching
- Educational content presentation

### Key Features Implementation

#### Shape Rendering System
```javascript
// Different shape types with accurate hit detection
drawCircle(element)     // Perfect circle with radius calculation
drawDiamond(element)    // Diamond with mathematical hit detection
drawTriangle(element)   // Triangle with proper geometry
drawRectangle(element)  // Standard rectangle with rounded corners option
```

#### Connection System
```javascript
// Smart connection point management
updateConnectionPoints(element)  // Dynamic connection point calculation
getConnectionPointAt(x, y)      // Precise connection point detection
drawConnection(connection)       // Arrow rendering with proper angles
```

#### Property Management
Real-time property updates with immediate visual feedback:
- Color pickers for fill and border
- Sliders for dimensions and styling
- Text input for labels and positioning
- Numeric inputs for precise control

## 🎨 Design Features

### Visual Design
- **Modern UI**: Clean, professional interface with gradient backgrounds
- **Responsive Layout**: Works on desktop and tablet devices
- **Visual Feedback**: Hover effects, selection indicators, connection points
- **Smooth Animations**: Fade-in effects and smooth transitions

### User Experience
- **Intuitive Controls**: Familiar drag-and-drop interface
- **Visual Indicators**: Clear selection handles and connection points
- **Real-time Updates**: Immediate property changes and canvas updates
- **Error Prevention**: Validation and boundary checking

## 📚 Educational Value

The methodology toggle system provides educational insights into:

1. **Development Approaches**: Compare different software development methodologies
2. **Implementation Strategies**: See how each approach would handle the same problem
3. **Code Examples**: Practical examples specific to diagramming interfaces
4. **Best Practices**: Learn when and how to apply different methodologies

## 🔧 Customization

### Adding New Shapes
1. Add shape preview to `index.html`
2. Implement drawing method in `script.js`
3. Add hit detection logic
4. Update shape creation logic

### Adding New Methodologies
1. Create new `.md` file in `db/` directory
2. Add option to methodology selector in `index.html`
3. Update methodology names mapping in `script.js`

### Styling Customization
Modify `styles.css` to change:
- Color schemes and gradients
- Layout and spacing
- Animation effects
- Responsive breakpoints

## 🚀 Future Enhancements

Potential improvements and extensions:
- **Collaborative Editing**: Real-time multi-user collaboration
- **Template Library**: Pre-built diagram templates
- **Export Formats**: SVG, PDF, and other vector formats
- **Advanced Shapes**: Custom shape creation and libraries
- **Layer Management**: Multiple layers with visibility controls
- **Grid Snapping**: Precise alignment tools
- **Keyboard Navigation**: Full keyboard accessibility

## 🤝 Contributing

This project demonstrates modern web development practices and educational methodology integration. Contributions are welcome for:
- New shape types and tools
- Additional development methodologies
- UI/UX improvements
- Performance optimizations
- Accessibility enhancements

## 📄 License

This project is created for educational and demonstration purposes, showcasing modern web development techniques and software development methodology education.

---

**Created with ❤️ as a comprehensive example of modern web-based diagramming tools with educational methodology integration.**
