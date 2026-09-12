import React, { useState, useEffect, useCallback, useMemo, useRef, Component } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { 
  Network, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  Bot, 
  BookOpen, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  GitBranch,
  ShieldAlert,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  X,
  Layers,
  Pause,
  Play,
  Crosshair,
  Target
} from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { useStudentId } from '../hooks/useStudentId';
import { knowledgeService } from '../services/knowledgeService';

// Page-level Error Boundary to ensure zero blank-screen failures
class KnowledgeMapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LearningGraph Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F3] text-[#171717] p-8 flex items-center justify-center">
          <div className="bg-white rounded-2xl border border-[#E7E1D7] p-6 max-w-lg shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-[#C94A45] flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl text-[#171717]">Unable to load Learning Graph</h2>
            <p className="text-xs text-[#6B6861]">
              We encountered an issue while rendering the interactive knowledge ecosystem.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-[#A8421E] text-white rounded-lg text-xs font-semibold hover:bg-[#8E3516] transition-colors cursor-pointer shadow-md"
            >
              Retry Learning Graph
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Canonical Galaxy Coordinates for Subjects and Concepts (1400 x 1100 Canvas Space)
const CANONICAL_LAYOUT = {
  // 1. CENTER: Student Journey Hub
  student_journey: { id: 'student_journey', x: 700, y: 550, baseClusterX: 700, baseClusterY: 550, type: 'hub', label: 'Student Journey', interactions: 86, subjects: 4, concepts: 12, radius: 46, seed: 1 },

  // 2. MATHEMATICS GALAXY (North Quadrant - Warm Amber #C58A24)
  subj_maths: { id: 'subj_maths', x: 500, y: 200, baseClusterX: 500, baseClusterY: 200, type: 'subject', label: 'Mathematics', symbol: '∑', color: '#C58A24', bgColor: '#FDF8ED', borderColor: '#E0AD45', radius: 36, seed: 2 },
  linear_algebra: { id: 'linear_algebra', x: 390, y: 110, baseClusterX: 500, baseClusterY: 200, type: 'concept', label: 'Linear Algebra', subject: 'maths', score: 61, state: 'learning', color: '#C58A24', bgColor: '#FDF8ED', radius: 24, seed: 3 },
  calculus: { id: 'calculus', x: 630, y: 95, baseClusterX: 500, baseClusterY: 200, type: 'concept', label: 'Calculus', subject: 'maths', score: 91, state: 'mastered', color: '#C58A24', bgColor: '#FDF8ED', radius: 24, seed: 4 },
  statistics: { id: 'statistics', x: 290, y: 220, baseClusterX: 500, baseClusterY: 200, type: 'concept', label: 'Statistics', subject: 'maths', score: 78, state: 'learning', color: '#C58A24', bgColor: '#FDF8ED', radius: 24, seed: 5 },
  probability: { id: 'probability', x: 680, y: 230, baseClusterX: 500, baseClusterY: 200, type: 'concept', label: 'Probability', subject: 'maths', score: 42, state: 'weak', color: '#C58A24', bgColor: '#FDF8ED', radius: 24, seed: 6 },
  conditional_probability: { id: 'conditional_probability', x: 580, y: 270, baseClusterX: 500, baseClusterY: 200, type: 'concept', label: 'Conditional Probability', subject: 'maths', score: 42, state: 'weak', color: '#C58A24', bgColor: '#FDF8ED', radius: 24, seed: 7 },
  bayes_theorem: { id: 'bayes_theorem', x: 610, y: 360, baseClusterX: 500, baseClusterY: 200, type: 'concept', label: 'Bayes Theorem', subject: 'maths', score: 42, state: 'weak', color: '#C58A24', bgColor: '#FDF8ED', radius: 24, seed: 8 },
  agent_maths: { id: 'agent_maths', x: 190, y: 340, baseClusterX: 500, baseClusterY: 200, type: 'agent', label: 'Maths Agent', subject: 'maths', color: '#7657A8', bgColor: '#F5EEFA', radius: 26, seed: 9 },

  // 3. APPLIED AI & ML GALAXY (North-East Quadrant - Royal Violet #7657A8)
  subj_aiml: { id: 'subj_aiml', x: 1060, y: 210, baseClusterX: 1060, baseClusterY: 210, type: 'subject', label: 'Applied AI & ML', symbol: '🧠', color: '#7657A8', bgColor: '#F5EEFA', borderColor: '#A284D1', radius: 36, seed: 10 },
  machine_learning: { id: 'machine_learning', x: 1190, y: 120, baseClusterX: 1060, baseClusterY: 210, type: 'concept', label: 'Machine Learning', subject: 'aiml', score: 75, state: 'learning', color: '#7657A8', bgColor: '#F5EEFA', radius: 24, seed: 11 },
  neural_networks: { id: 'neural_networks', x: 1320, y: 210, baseClusterX: 1060, baseClusterY: 210, type: 'concept', label: 'Neural Networks', subject: 'aiml', score: 68, state: 'learning', color: '#7657A8', bgColor: '#F5EEFA', radius: 24, seed: 12 },
  deep_learning: { id: 'deep_learning', x: 1260, y: 320, baseClusterX: 1060, baseClusterY: 210, type: 'concept', label: 'Deep Learning', subject: 'aiml', score: 55, state: 'learning', color: '#7657A8', bgColor: '#F5EEFA', radius: 24, seed: 13 },
  gradient_descent: { id: 'gradient_descent', x: 1140, y: 340, baseClusterX: 1060, baseClusterY: 210, type: 'concept', label: 'Gradient Descent', subject: 'aiml', score: 58, state: 'learning', color: '#7657A8', bgColor: '#F5EEFA', radius: 24, seed: 14 },
  naive_bayes: { id: 'naive_bayes', x: 910, y: 330, baseClusterX: 1060, baseClusterY: 210, type: 'concept', label: 'Naive Bayes', subject: 'aiml', score: 35, state: 'weak', color: '#7657A8', bgColor: '#F5EEFA', radius: 24, seed: 15 },
  agent_aiml: { id: 'agent_aiml', x: 1280, y: 440, baseClusterX: 1060, baseClusterY: 210, type: 'agent', label: 'AIML Agent', subject: 'aiml', color: '#7657A8', bgColor: '#F5EEFA', radius: 26, seed: 16 },

  // 4. DATA STRUCTURES & ALGORITHMS GALAXY (South-West Quadrant - Forest Emerald #3F7D58)
  subj_dsa: { id: 'subj_dsa', x: 280, y: 770, baseClusterX: 280, baseClusterY: 770, type: 'subject', label: 'Data Structures & Algorithms', symbol: '⛁', color: '#3F7D58', bgColor: '#EDF6F0', borderColor: '#63A87F', radius: 36, seed: 17 },
  arrays: { id: 'arrays', x: 130, y: 640, baseClusterX: 280, baseClusterY: 770, type: 'concept', label: 'Arrays', subject: 'dsa', score: 81, state: 'mastered', color: '#3F7D58', bgColor: '#EDF6F0', radius: 24, seed: 18 },
  recursion: { id: 'recursion', x: 380, y: 640, baseClusterX: 280, baseClusterY: 770, type: 'concept', label: 'Recursion', subject: 'dsa', score: 55, state: 'learning', color: '#3F7D58', bgColor: '#EDF6F0', radius: 24, seed: 19 },
  dynamic_programming: { id: 'dynamic_programming', x: 90, y: 770, baseClusterX: 280, baseClusterY: 770, type: 'concept', label: 'Dynamic Programming', subject: 'dsa', score: 29, state: 'weak', color: '#3F7D58', bgColor: '#EDF6F0', radius: 24, seed: 20 },
  trees: { id: 'trees', x: 120, y: 910, baseClusterX: 280, baseClusterY: 770, type: 'concept', label: 'Trees', subject: 'dsa', score: 70, state: 'learning', color: '#3F7D58', bgColor: '#EDF6F0', radius: 24, seed: 21 },
  graphs: { id: 'graphs', x: 250, y: 1000, baseClusterX: 280, baseClusterY: 770, type: 'concept', label: 'Graphs', subject: 'dsa', score: 65, state: 'learning', color: '#3F7D58', bgColor: '#EDF6F0', radius: 24, seed: 22 },
  binary_trees: { id: 'binary_trees', x: 440, y: 1010, baseClusterX: 280, baseClusterY: 770, type: 'concept', label: 'Binary Trees', subject: 'dsa', score: 72, state: 'learning', color: '#3F7D58', bgColor: '#EDF6F0', radius: 24, seed: 23 },
  graph_algorithms: { id: 'graph_algorithms', x: 590, y: 1000, baseClusterX: 280, baseClusterY: 770, type: 'concept', label: 'Graph Algorithms', subject: 'dsa', score: 60, state: 'learning', color: '#3F7D58', bgColor: '#EDF6F0', radius: 24, seed: 24 },
  agent_dsa: { id: 'agent_dsa', x: 620, y: 780, baseClusterX: 280, baseClusterY: 770, type: 'agent', label: 'DSA Agent', subject: 'dsa', color: '#7657A8', bgColor: '#F5EEFA', radius: 26, seed: 25 },

  // 5. DATABASE SYSTEMS GALAXY (South-East Quadrant - Warm Terracotta #C65D3A)
  subj_dbms: { id: 'subj_dbms', x: 1100, y: 770, baseClusterX: 1100, baseClusterY: 770, type: 'subject', label: 'Database Systems', symbol: '🗄️', color: '#C65D3A', bgColor: '#FAF0EB', borderColor: '#E68A6E', radius: 36, seed: 26 },
  sql_joins: { id: 'sql_joins', x: 1250, y: 650, baseClusterX: 1100, baseClusterY: 770, type: 'concept', label: 'SQL Joins', subject: 'dbms', score: 64, state: 'learning', color: '#C65D3A', bgColor: '#FAF0EB', radius: 24, seed: 27 },
  normalization: { id: 'normalization', x: 1330, y: 760, baseClusterX: 1100, baseClusterY: 770, type: 'concept', label: 'Normalization', subject: 'dbms', score: 47, state: 'weak', color: '#C65D3A', bgColor: '#FAF0EB', radius: 24, seed: 28 },
  er_diagrams: { id: 'er_diagrams', x: 1280, y: 890, baseClusterX: 1100, baseClusterY: 770, type: 'concept', label: 'ER Diagrams', subject: 'dbms', score: 85, state: 'mastered', color: '#C65D3A', bgColor: '#FAF0EB', radius: 24, seed: 29 },
  indexes: { id: 'indexes', x: 1150, y: 980, baseClusterX: 1100, baseClusterY: 770, type: 'concept', label: 'Indexes', subject: 'dbms', score: 58, state: 'learning', color: '#C65D3A', bgColor: '#FAF0EB', radius: 24, seed: 30 },
  transactions: { id: 'transactions', x: 960, y: 930, baseClusterX: 1100, baseClusterY: 770, type: 'concept', label: 'Transactions', subject: 'dbms', score: 76, state: 'learning', color: '#C65D3A', bgColor: '#FAF0EB', radius: 24, seed: 31 },
  agent_dbms: { id: 'agent_dbms', x: 880, y: 780, baseClusterX: 1100, baseClusterY: 770, type: 'agent', label: 'DBMS Agent', subject: 'dbms', color: '#7657A8', bgColor: '#F5EEFA', radius: 26, seed: 32 },
  agent_general: { id: 'agent_general', x: 700, y: 710, baseClusterX: 700, baseClusterY: 550, type: 'agent', label: 'General Agent', subject: 'general', color: '#7657A8', bgColor: '#F5EEFA', radius: 26, seed: 33 },
};

function KnowledgeMapContent() {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const setSidebarOpen = outletContext?.setSidebarOpen || (() => {});
  const studentId = useStudentId();

  // State
  const [viewMode, setViewMode] = useState('graph'); // 'graph' | 'timeline'
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | 'month' | 'week'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'concepts' | 'queries' | 'bottlenecks'
  const [isMotionActive, setIsMotionActive] = useState(true);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dynamic Graph Data from Real Backend — starts empty; assembleDynamicGraph
  // fills it in from the actual API response once it loads.
  const [graphSummary, setGraphSummary] = useState({
    total_concepts: 0,
    mastered_concepts: 0,
    learning_concepts: 0,
    weak_concepts: 0,
    subjects_covered: [],
    agents_used: [],
    total_questions: 0,
    top_bottleneck: null,
  });

  const [activeNodesList, setActiveNodesList] = useState([]);
  const [activeEdgesList, setActiveEdgesList] = useState([]);

  // Zoom and Pan
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Physics Simulation Data (Ref-based for 60fps continuous organic movement without React rerender lag)
  const simulationNodesRef = useRef([]);
  const simulationEdgesRef = useRef([]);
  const nodeElementsRef = useRef({});
  const edgeElementsRef = useRef({});
  const edgeLabelElementsRef = useRef({});
  const animationFrameRef = useRef(null);

  // Build Layout with Real Backend Data
  const assembleDynamicGraph = useCallback((apiData) => {
    const nodes = [];
    const edges = [];
    // No fallback numbers here: when the API has no data for this student
    // (or the request failed), the honest summary is all zeros, not a
    // plausible-looking made-up snapshot.
    const summary = apiData?.summary || {
      total_concepts: 0,
      mastered_concepts: 0,
      learning_concepts: 0,
      weak_concepts: 0,
      subjects_covered: [],
      agents_used: [],
      total_questions: 0,
      top_bottleneck: null,
    };

    setGraphSummary(summary);

    // 1. Add Central Student Journey Hub
    const hubNode = {
      ...CANONICAL_LAYOUT.student_journey,
      interactions: summary.total_questions ?? 0,
      subjects: summary.subjects_covered?.length ?? 0,
      concepts: summary.total_concepts ?? 0,
      vx: 0,
      vy: 0,
      origX: 700,
      origY: 550,
    };
    nodes.push(hubNode);

    // 2. Add 4 Subject Hubs
    ['subj_maths', 'subj_aiml', 'subj_dsa', 'subj_dbms'].forEach(sId => {
      if (CANONICAL_LAYOUT[sId]) {
        nodes.push({
          ...CANONICAL_LAYOUT[sId],
          vx: 0,
          vy: 0,
          origX: CANONICAL_LAYOUT[sId].x,
          origY: CANONICAL_LAYOUT[sId].y,
        });
      }
    });

    // 3. Add Concept Nodes with Live Student Mastery
    const apiNodeMap = {};
    if (apiData?.nodes) {
      apiData.nodes.forEach(n => { apiNodeMap[n.id] = n; });
    }

    Object.keys(CANONICAL_LAYOUT).forEach((cId) => {
      const template = CANONICAL_LAYOUT[cId];
      if (template.type === 'concept') {
        // CANONICAL_LAYOUT only supplies this concept's fixed x/y position,
        // color and label — never its mastery. A topic the backend hasn't
        // reported real mastery for reads as untouched (0% / new), not the
        // template's placeholder score.
        const live = apiNodeMap[cId];
        const score = live?.mastery !== undefined ? live.mastery : 0;
        const state = live?.state || 'new';
        nodes.push({
          ...template,
          score,
          state,
          metadata: live?.metadata || {},
          vx: 0,
          vy: 0,
          origX: template.x,
          origY: template.y,
        });
      }
    });

    // 4. Add Active Agent Nodes
    ['agent_maths', 'agent_aiml', 'agent_dsa', 'agent_dbms', 'agent_general'].forEach(agId => {
      if (CANONICAL_LAYOUT[agId]) {
        nodes.push({
          ...CANONICAL_LAYOUT[agId],
          vx: 0,
          vy: 0,
          origX: CANONICAL_LAYOUT[agId].x,
          origY: CANONICAL_LAYOUT[agId].y,
        });
      }
    });

    // 5. Add Real Student Question Nodes (from agent_routing_log)
    if (apiData?.nodes) {
      const questionNodes = apiData.nodes.filter(n => n.node_type === 'question');
      questionNodes.forEach((qn, idx) => {
        const subject = qn.subject || 'dsa';
        // Place question near its subject galaxy anchor
        const anchor = CANONICAL_LAYOUT[`subj_${subject}`] || CANONICAL_LAYOUT.subj_dsa;
        const angle = (idx / Math.max(1, questionNodes.length)) * Math.PI * 1.6 + 0.3;
        const radius = 130 + (idx % 3) * 25;
        const qx = Math.round(anchor.x + Math.cos(angle) * radius);
        const qy = Math.round(anchor.y + Math.sin(angle) * radius);

        nodes.push({
          id: qn.id,
          x: qx,
          y: qy,
          baseClusterX: anchor.x,
          baseClusterY: anchor.y,
          origX: qx,
          origY: qy,
          vx: 0,
          vy: 0,
          type: 'question',
          label: qn.label.replace(/"/g, ''),
          subject: subject,
          agent: qn.metadata?.agent || subject,
          color: '#D94F83',
          bgColor: '#FDF0F5',
          radius: 22,
          seed: 40 + idx,
          metadata: qn.metadata || {},
        });
      });
    }

    // 6. Connect Hub Edges to Subject Galaxies
    edges.push({ id: 'e_hub_maths', src: 'student_journey', tgt: 'subj_maths', label: '', glow: '#C58A24' });
    edges.push({ id: 'e_hub_aiml', src: 'student_journey', tgt: 'subj_aiml', label: '', glow: '#7657A8' });
    edges.push({ id: 'e_hub_dsa', src: 'student_journey', tgt: 'subj_dsa', label: '', glow: '#3F7D58' });
    edges.push({ id: 'e_hub_dbms', src: 'student_journey', tgt: 'subj_dbms', label: '', glow: '#C65D3A' });

    // 7. Add Concept Prerequisite and Question Edges
    if (apiData?.edges && apiData.edges.length > 0) {
      const nodeIds = new Set(nodes.map(n => n.id));
      apiData.edges.forEach((be, bIdx) => {
        if (nodeIds.has(be.source) && nodeIds.has(be.target)) {
          edges.push({
            id: be.id || `e_api_${bIdx}`,
            src: be.source,
            tgt: be.target,
            label: be.label || (be.edge_type === 'prerequisite_of' ? 'prerequisite' : be.edge_type === 'asked_about' ? 'asked about' : be.edge_type === 'answered_by' ? 'answered by' : ''),
            edge_type: be.edge_type,
            dashed: be.edge_type === 'asked_about' || be.edge_type === 'related_to' || be.edge_type === 'journey_step',
          });
        }
      });
    }

    simulationNodesRef.current = nodes;
    simulationEdgesRef.current = edges;
    setActiveNodesList(nodes);
    setActiveEdgesList(edges);
  }, []);

  // Load Graph Data from Real Backend
  const loadGraph = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await knowledgeService.getLearningGraph(studentId);
      if (res && res.data) {
        assembleDynamicGraph(res.data);
      }
    } catch (err) {
      console.error('Failed to load live student learning graph:', err);
      // Fallback assembly
      assembleDynamicGraph(null);
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  }, [studentId, assembleDynamicGraph]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  // Connected node IDs lookup for interactive hover highlight
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId && !selectedNodeId) return null;
    const targetId = hoveredNodeId || selectedNodeId;
    const set = new Set([targetId]);
    simulationEdgesRef.current.forEach(e => {
      if (e.src === targetId) set.add(e.tgt);
      if (e.tgt === targetId) set.add(e.src);
    });
    return set;
  }, [hoveredNodeId, selectedNodeId]);

  // Filter check
  const isNodeVisible = useCallback((node) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'concepts') return node.type === 'concept' || node.type === 'subject' || node.type === 'hub';
    if (activeFilter === 'queries') return node.type === 'question' || node.type === 'agent' || node.type === 'hub';
    if (activeFilter === 'bottlenecks') return node.state === 'weak' || node.type === 'hub' || node.type === 'subject';
    return true;
  }, [activeFilter]);

  // CONTINUOUS PHYSICS SIMULATION TICK LOOP (60 FPS Native DOM Transforms)
  useEffect(() => {
    let lastTime = performance.now();

    const tick = (currentTime) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.033);
      lastTime = currentTime;

      if (isMotionActive && simulationNodesRef.current.length > 0) {
        const nodes = simulationNodesRef.current;
        const edges = simulationEdgesRef.current;
        const count = nodes.length;

        // 1. Continuous Organic Wave & Harmonic Drift
        for (let i = 0; i < count; i++) {
          const n = nodes[i];
          if (n.type === 'hub') {
            // Student Journey Hub maintains smooth gentle central anchor float
            const waveX = Math.sin(currentTime * 0.0008) * 0.4;
            const waveY = Math.cos(currentTime * 0.0006) * 0.4;
            n.vx += (n.origX + waveX - n.x) * 0.02;
            n.vy += (n.origY + waveY - n.y) * 0.02;
          } else {
            // Harmonic drift per node
            const speed = 0.001 + (n.seed % 5) * 0.0003;
            const wanderX = Math.sin(currentTime * speed + n.seed * 1.7) * 2.2;
            const wanderY = Math.cos(currentTime * speed * 0.85 + n.seed * 2.3) * 2.2;

            // Soft cluster centering force
            const clusterStrength = n.type === 'subject' ? 0.018 : 0.012;
            n.vx += (n.origX + wanderX - n.x) * clusterStrength;
            n.vy += (n.origY + wanderY - n.y) * clusterStrength;
          }
        }

        // 2. Node-to-Node Repulsion (Coulomb dispersion)
        for (let i = 0; i < count; i++) {
          for (let j = i + 1; j < count; j++) {
            const n1 = nodes[i];
            const n2 = nodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const distSq = dx * dx + dy * dy || 1;
            const minDist = (n1.radius || 24) + (n2.radius || 24) + 40;

            if (distSq < minDist * minDist) {
              const dist = Math.sqrt(distSq);
              const overlap = (minDist - dist) / dist;
              const fx = dx * overlap * 0.05;
              const fy = dy * overlap * 0.05;
              n1.vx -= fx;
              n1.vy -= fy;
              n2.vx += fx;
              n2.vy += fy;
            }
          }
        }

        // 3. Link Spring Attraction/Repulsion
        for (let e of edges) {
          const src = nodes.find(n => n.id === e.src);
          const tgt = nodes.find(n => n.id === e.tgt);
          if (src && tgt) {
            const dx = tgt.x - src.x;
            const dy = tgt.y - src.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const targetLen = e.dashed ? 260 : 180;
            const delta = (dist - targetLen) * 0.002;
            const fx = (dx / dist) * delta;
            const fy = (dy / dist) * delta;
            src.vx += fx;
            src.vy += fy;
            tgt.vx -= fx;
            tgt.vy -= fy;
          }
        }

        // 4. Update Node Positions & Damping
        for (let i = 0; i < count; i++) {
          const n = nodes[i];
          n.vx *= 0.93;
          n.vy *= 0.93;
          n.x += n.vx;
          n.y += n.vy;

          // Viewport constraint clamp
          n.x = Math.max(70, Math.min(1330, n.x));
          n.y = Math.max(70, Math.min(1030, n.y));

          // Update SVG Node DOM Group
          const el = nodeElementsRef.current[n.id];
          if (el) {
            el.setAttribute('transform', `translate(${n.x}, ${n.y})`);
          }
        }

        // 5. Update Connecting Edge Lines & Text Labels
        const nodePosMap = {};
        for (let n of nodes) nodePosMap[n.id] = n;

        for (let e of edges) {
          const src = nodePosMap[e.src];
          const tgt = nodePosMap[e.tgt];
          if (src && tgt) {
            const lineEl = edgeElementsRef.current[e.id];
            if (lineEl) {
              lineEl.setAttribute('x1', src.x);
              lineEl.setAttribute('y1', src.y);
              lineEl.setAttribute('x2', tgt.x);
              lineEl.setAttribute('y2', tgt.y);
            }
            const labelGroup = edgeLabelElementsRef.current[e.id];
            if (labelGroup) {
              const mx = (src.x + tgt.x) / 2;
              const my = (src.y + tgt.y) / 2;
              labelGroup.setAttribute('transform', `translate(${mx}, ${my})`);
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMotionActive]);

  // Node Click handler
  const handleNodeClick = (nodeId) => {
    setSelectedNodeId(nodeId);
    setInspectorOpen(true);
  };

  const activeNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return simulationNodesRef.current.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId]);

  // Canvas Pan Handlers
  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.tagName === 'rect' || e.target.classList.contains('canvas-bg')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Center on Student Hub
  const handleCenterStudent = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#171717] pb-10 overflow-x-hidden selection:bg-[#A8421E]/20 font-sans">
      {/* Workspace Header */}
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 pt-4 space-y-4">
        
        {/* Top Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-[#E7E1D7] shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#A8421E] to-[#C58A24] flex items-center justify-center text-white shadow-md shadow-[#A8421E]/15">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-serif font-bold tracking-tight text-[#171717]">
                  EduHive <span className="font-sans font-light text-[#6B6861]">Student Learning Graph</span>
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#3F7D58] font-semibold flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full bg-[#3F7D58] ${isMotionActive ? 'animate-ping' : ''}`}></span>
                  Living Constellation
                </span>
              </div>
              <p className="text-xs text-[#6B6861]">
                Continuous organic knowledge ecosystem representing your real learning journey across 4 disciplines.
              </p>
            </div>
          </div>

          {/* Top Right Controls: Motion + Filters + Metrics */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Continuous Motion Toggle */}
            <button
              type="button"
              onClick={() => setIsMotionActive(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                isMotionActive 
                  ? 'bg-emerald-50 border-emerald-200 text-[#3F7D58] hover:bg-emerald-100' 
                  : 'bg-amber-50 border-amber-200 text-[#C58A24] hover:bg-amber-100'
              }`}
              title={isMotionActive ? 'Pause continuous graph motion' : 'Resume organic movement'}
            >
              {isMotionActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isMotionActive ? 'Motion: Living' : 'Motion: Paused'}</span>
            </button>

            {/* Filter Mode Selector */}
            <div className="inline-flex rounded-xl bg-[#F4EFE6] border border-[#E7E1D7] p-1 text-xs font-mono shadow-inner">
              {[
                { id: 'all', label: 'All', icon: Layers },
                { id: 'concepts', label: 'Concepts', icon: BookOpen },
                { id: 'queries', label: 'Q&A', icon: MessageSquare },
                { id: 'bottlenecks', label: 'Bottlenecks', icon: ShieldAlert },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                      isActive 
                        ? 'bg-white text-[#171717] font-semibold border border-[#E7E1D7] shadow-xs' 
                        : 'text-[#6B6861] hover:text-[#171717]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#A8421E]' : ''}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Time Filter Pills */}
            <div className="inline-flex rounded-xl bg-[#F4EFE6] border border-[#E7E1D7] p-1 text-xs font-mono shadow-inner">
              {['All Time', 'Month', 'Week'].map((label, i) => {
                const key = i === 0 ? 'all' : i === 1 ? 'month' : 'week';
                const isActive = timeFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTimeFilter(key)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#A8421E] text-white font-semibold shadow-xs' 
                        : 'text-[#6B6861] hover:text-[#171717]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Live Dynamic Stat Counter Pills */}
            <div className="hidden xl:flex items-center gap-2 bg-white border border-[#E7E1D7] px-3.5 py-1.5 rounded-xl shadow-xs font-mono text-xs">
              <div className="flex items-center gap-1.5 text-[#D94F83] pr-2 border-r border-[#E7E1D7]">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="font-bold text-[#171717]">{graphSummary.total_questions ?? activeNodesList.filter(n => n.type === 'question').length}</span>
                <span className="text-[10px] text-[#6B6861]">Q&A</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#C58A24] pr-2 border-r border-[#E7E1D7] pl-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="font-bold text-[#171717]">{graphSummary.subjects_covered?.length ?? 0}</span>
                <span className="text-[10px] text-[#6B6861]">Subjects</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#3F7D58] pr-2 border-r border-[#E7E1D7] pl-1">
                <Network className="w-3.5 h-3.5" />
                <span className="font-bold text-[#171717]">{graphSummary.total_concepts ?? 0}</span>
                <span className="text-[10px] text-[#6B6861]">Concepts</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#7657A8] pl-1">
                <Bot className="w-3.5 h-3.5" />
                <span className="font-bold text-[#171717]">{graphSummary.agents_used?.length ?? 0}</span>
                <span className="text-[10px] text-[#6B6861]">Agents</span>
              </div>
            </div>

            {/* View Mode Toggle */}
            <button
              type="button"
              onClick={() => setViewMode(v => v === 'graph' ? 'timeline' : 'graph')}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F4EFE6] border border-[#E7E1D7] text-xs font-mono text-[#171717] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              {viewMode === 'graph' ? <GitBranch className="w-3.5 h-3.5 text-[#C58A24]" /> : <Network className="w-3.5 h-3.5 text-[#A8421E]" />}
              <span>{viewMode === 'graph' ? 'Timeline' : 'Graph'}</span>
            </button>
          </div>
        </div>

        {/* Main Canvas Area (Pure Editorial White Theme) */}
        <div className="relative w-full rounded-2xl bg-white border border-[#E7E1D7] shadow-xl overflow-hidden min-h-[740px]">
          
          {/* Zoom / Pan Controls Overlay (Top-Right of Canvas) */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-md border border-[#E7E1D7] p-1 rounded-xl shadow-md font-mono text-xs">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
              className="p-1.5 hover:bg-[#F4EFE6] rounded-lg text-[#6B6861] hover:text-[#171717] transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.45, z - 0.15))}
              className="p-1.5 hover:bg-[#F4EFE6] rounded-lg text-[#6B6861] hover:text-[#171717] transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCenterStudent}
              className="p-1.5 hover:bg-[#F4EFE6] rounded-lg text-[#6B6861] hover:text-[#171717] transition-colors cursor-pointer"
              title="Center Student"
            >
              <Crosshair className="w-4 h-4 text-[#A8421E]" />
            </button>
            <button
              type="button"
              onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
              className="p-1.5 hover:bg-[#F4EFE6] rounded-lg text-[#6B6861] hover:text-[#171717] transition-colors cursor-pointer"
              title="Reset View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={loadGraph}
              className="p-1.5 hover:bg-[#F4EFE6] rounded-lg text-[#6B6861] hover:text-[#171717] transition-colors cursor-pointer"
              title="Sync Graph"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#A8421E]' : ''}`} />
            </button>
          </div>

          {/* Left HUD Legend Overlay (White Editorial Palette) */}
          <div className="absolute top-4 left-4 z-20 hidden md:block bg-white/90 backdrop-blur-md border border-[#E7E1D7] p-3.5 rounded-2xl shadow-lg w-52 font-mono text-[11px] space-y-2 select-none">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#E7E1D7]">
              <span className="text-[10px] font-bold text-[#171717] uppercase tracking-wider font-serif">Knowledge Taxonomy</span>
              <span className="text-[9px] text-[#A8421E] font-sans">Hover to focus</span>
            </div>
            <div className="space-y-1.5 text-[#171717]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C58A24] border border-[#E0AD45]"></span>
                <span>Mathematics Hub & Concepts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3F7D58] border border-[#63A87F]"></span>
                <span>DSA Hub & Concepts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7657A8] border border-[#A284D1]"></span>
                <span>AIML Hub & Concepts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C65D3A] border border-[#E68A6E]"></span>
                <span>DBMS Hub & Concepts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D94F83] border border-[#F084AC]"></span>
                <span>Question Query Nodes</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E7E1D7] space-y-1 text-[10px] text-[#6B6861]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-[#3F7D58]"></span>
                <span>Prerequisite Lineage</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 border-t border-dashed border-[#8C867D]"></span>
                <span>Cross-Domain Related</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-[#D94F83]"></span>
                <span>Asked About</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-[#7657A8]"></span>
                <span>Answered By</span>
              </div>
            </div>
          </div>

          {/* Bottom-Right Learning Insights Floating Card */}
          <div className="absolute bottom-4 right-4 z-20 hidden lg:block bg-white/95 backdrop-blur-md border border-[#E7E1D7] p-4 rounded-2xl shadow-xl max-w-xs font-sans text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-[#A8421E]">
              <Lightbulb className="w-4 h-4 text-[#C58A24]" />
              <span className="font-serif text-sm text-[#171717]">Learning Insights</span>
            </div>
            <div className="space-y-1.5 text-[#6B6861] text-[11px] leading-relaxed">
              <p className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C58A24] shrink-0 mt-1"></span>
                <span>Top Focus: <strong>{graphSummary.top_bottleneck || 'No diagnostic data yet'}</strong></span>
              </p>
              <p className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D94F83] shrink-0 mt-1"></span>
                <span>{graphSummary.weak_concepts ?? 0} concepts identified as weak or needing reinforcement.</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3F7D58] shrink-0 mt-1"></span>
                <span>{graphSummary.mastered_concepts ?? 0} concept{graphSummary.mastered_concepts === 1 ? '' : 's'} fully mastered across curriculum.</span>
              </p>
            </div>
          </div>

          {/* Bottom-Left Motto */}
          <div className="absolute bottom-4 left-4 z-20 text-[11px] font-mono text-[#8C867D] hidden sm:block">
            Knowledge grows when ideas connect.
          </div>

          {/* INTERACTIVE LIGHT CANVAS WITH CONTINUOUS PHYSICS SIMULATION */}
          <div
            className="w-full h-[720px] md:h-[800px] flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <svg
              viewBox="0 0 1400 1100"
              className="w-full h-full"
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                transformOrigin: 'center center',
              }}
            >
              <defs>
                {/* Arrow Markers for White Theme */}
                <marker id="arrow-green" viewBox="0 0 10 10" refX="26" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#3F7D58" />
                </marker>
                <marker id="arrow-amber" viewBox="0 0 10 10" refX="26" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#C58A24" />
                </marker>
                <marker id="arrow-pink" viewBox="0 0 10 10" refX="26" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#D94F83" />
                </marker>
                <marker id="arrow-violet" viewBox="0 0 10 10" refX="26" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#7657A8" />
                </marker>
                <marker id="arrow-muted" viewBox="0 0 10 10" refX="26" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#8C867D" />
                </marker>

                {/* Subtle White-Theme Pastel Galaxy Aura Fields */}
                <radialGradient id="maths-light-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#C58A24" stopOpacity="0.10" />
                  <stop offset="60%" stopColor="#C58A24" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="#C58A24" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="aiml-light-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7657A8" stopOpacity="0.10" />
                  <stop offset="60%" stopColor="#7657A8" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="#7657A8" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="dsa-light-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3F7D58" stopOpacity="0.10" />
                  <stop offset="60%" stopColor="#3F7D58" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="#3F7D58" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="dbms-light-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#C65D3A" stopOpacity="0.10" />
                  <stop offset="60%" stopColor="#C65D3A" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="#C65D3A" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="hub-light-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#A8421E" stopOpacity="0.12" />
                  <stop offset="70%" stopColor="#7657A8" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Background Canvas Catchment for dragging */}
              <rect x="0" y="0" width="1400" height="1100" fill="transparent" className="canvas-bg" />

              {/* Subtle Ambient Dots / Constellation Grid on Light Background */}
              {[
                [150, 120], [300, 70], [520, 60], [800, 110], [1050, 90], [1280, 120],
                [90, 360], [310, 420], [920, 480], [1340, 420],
                [80, 700], [680, 750], [120, 980], [650, 950], [1320, 920], [1000, 1040]
              ].map(([sx, sy], idx) => (
                <circle key={idx} cx={sx} cy={sy} r="1.5" fill="#E7E1D7" />
              ))}

              {/* Background Pastel Galaxy Aura Clouds */}
              <circle cx="490" cy="210" r="270" fill="url(#maths-light-glow)" />
              <circle cx="1090" cy="230" r="270" fill="url(#aiml-light-glow)" />
              <circle cx="290" cy="800" r="290" fill="url(#dsa-light-glow)" />
              <circle cx="1120" cy="800" r="290" fill="url(#dbms-light-glow)" />
              <circle cx="700" cy="550" r="220" fill="url(#hub-light-glow)" />

              {/* CONNECTING FLOWING EDGES */}
              {activeEdgesList.map((edge) => {
                const src = simulationNodesRef.current.find(n => n.id === edge.src);
                const tgt = simulationNodesRef.current.find(n => n.id === edge.tgt);
                if (!src || !tgt) return null;

                const isPrereq = edge.label === 'prerequisite' || edge.label === 'Gates';
                const isAsked = edge.label === 'asked about' || edge.label === 'Asked About';
                const isAnswered = edge.label === 'answered by' || edge.label === 'Answered By';

                let strokeColor = '#D4CEBF';
                let marker = 'url(#arrow-muted)';
                if (isPrereq) { strokeColor = '#3F7D58'; marker = 'url(#arrow-green)'; }
                else if (isAsked) { strokeColor = '#D94F83'; marker = 'url(#arrow-pink)'; }
                else if (isAnswered) { strokeColor = '#7657A8'; marker = 'url(#arrow-violet)'; }
                else if (edge.glow) { strokeColor = edge.glow; }

                const isConnected = !connectedNodeIds || (connectedNodeIds.has(edge.src) && connectedNodeIds.has(edge.tgt));
                const edgeOpacity = (hoveredNodeId || selectedNodeId) ? (isConnected ? 0.95 : 0.15) : 0.65;
                const isLabelHighlighted = (hoveredNodeId || selectedNodeId) && isConnected;

                const midX = (src.x + tgt.x) / 2;
                const midY = (src.y + tgt.y) / 2;

                return (
                  <g key={edge.id} className="transition-opacity duration-200" opacity={edgeOpacity}>
                    <line
                      ref={(el) => { if (el) edgeElementsRef.current[edge.id] = el; }}
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={strokeColor}
                      strokeWidth={isPrereq ? 1.75 : isAsked || isAnswered ? 1.5 : 1.2}
                      strokeDasharray={edge.dashed || isAsked ? '4,4' : 'none'}
                      markerEnd={marker}
                    />
                    {edge.label && (
                      <g
                        ref={(el) => { if (el) edgeLabelElementsRef.current[edge.id] = el; }}
                        transform={`translate(${midX}, ${midY})`}
                        opacity={isLabelHighlighted ? 1 : 0.45}
                        className="transition-opacity duration-200"
                      >
                        <rect
                          x={-(edge.label.length * 2.8 + 6)}
                          y="-10"
                          width={edge.label.length * 5.6 + 12}
                          height="14"
                          rx="4"
                          fill="#FFFFFF"
                          stroke="#E7E1D7"
                          strokeWidth="0.8"
                        />
                        <text
                          x="0"
                          y="0"
                          textAnchor="middle"
                          className="text-[7.5px] font-mono fill-[#6B6861] select-none font-medium"
                        >
                          {edge.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* CONSTELLATION NODES (Driven organically by continuous physics loop) */}
              {activeNodesList.map((node) => {
                if (!isNodeVisible(node)) return null;

                const isSelected = selectedNodeId === node.id;
                const isConnected = !connectedNodeIds || connectedNodeIds.has(node.id);
                const nodeOpacity = (hoveredNodeId || selectedNodeId) ? (isConnected ? 1 : 0.22) : 1;

                // 1. CENTRAL STUDENT JOURNEY HUB (Anchor Centerpiece)
                if (node.type === 'hub') {
                  return (
                    <g
                      key={node.id}
                      ref={(el) => { if (el) nodeElementsRef.current[node.id] = el; }}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="cursor-pointer transition-all duration-150 hover:scale-105"
                      opacity={nodeOpacity}
                      onClick={() => handleNodeClick(node.id)}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                    >
                      {/* White Light Box Container */}
                      <rect
                        x="-80"
                        y="-42"
                        width="160"
                        height="84"
                        rx="18"
                        fill="#FFFFFF"
                        stroke="#A8421E"
                        strokeWidth="2"
                        className="drop-shadow-[0_8px_20px_rgba(168,66,30,0.15)]"
                      />
                      <circle cx="0" cy="-14" r="12" fill="#FAF8F3" stroke="#A8421E" strokeWidth="1.5" />
                      <text x="0" y="-9" textAnchor="middle" className="text-xs">
                        👤
                      </text>
                      <text x="0" y="12" textAnchor="middle" className="text-xs font-bold font-serif fill-[#171717] tracking-wide">
                        {node.label}
                      </text>
                      <text x="0" y="26" textAnchor="middle" className="text-[8px] font-mono fill-[#A8421E] font-semibold">
                        {node.interactions} questions • {node.subjects} subjects
                      </text>
                      <text x="0" y="36" textAnchor="middle" className="text-[7.5px] font-mono fill-[#6B6861]">
                        {node.concepts} key concepts
                      </text>
                    </g>
                  );
                }

                // 2. SUBJECT HUB (Galaxy Anchor Nodes)
                if (node.type === 'subject') {
                  return (
                    <g
                      key={node.id}
                      ref={(el) => { if (el) nodeElementsRef.current[node.id] = el; }}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="cursor-pointer transition-all duration-150 hover:scale-105"
                      opacity={nodeOpacity}
                      onClick={() => handleNodeClick(node.id)}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                    >
                      {/* Radial subject ring */}
                      <circle
                        cx="0"
                        cy="0"
                        r="32"
                        fill={node.bgColor || '#FFFFFF'}
                        stroke={node.color}
                        strokeWidth="2.5"
                        className="drop-shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
                      />
                      <text x="0" y="5" textAnchor="middle" className="text-lg fill-[#171717] font-bold">
                        {node.symbol}
                      </text>
                      <text x="0" y="48" textAnchor="middle" className="text-[12px] font-bold font-serif fill-[#171717] tracking-wide">
                        {node.label.split('\n')[0]}
                      </text>
                      {node.label.split('\n')[1] && (
                        <text x="0" y="60" textAnchor="middle" className="text-[10px] font-medium fill-[#6B6861]">
                          {node.label.split('\n')[1]}
                        </text>
                      )}
                    </g>
                  );
                }

                // 3. CONCEPT NODE
                if (node.type === 'concept') {
                  const isWeak = node.state === 'weak';
                  const isMastered = node.state === 'mastered';
                  return (
                    <g
                      key={node.id}
                      ref={(el) => { if (el) nodeElementsRef.current[node.id] = el; }}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="cursor-pointer transition-all duration-150 hover:scale-110"
                      opacity={nodeOpacity}
                      onClick={() => handleNodeClick(node.id)}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                    >
                      {/* Selection Ring */}
                      {isSelected && (
                        <circle
                          cx="0"
                          cy="0"
                          r="28"
                          fill="none"
                          stroke="#A8421E"
                          strokeWidth="2.5"
                          strokeDasharray="4,2"
                        />
                      )}
                      {/* Outer glow ring for weak / blocker */}
                      {isWeak && (
                        <circle
                          cx="0"
                          cy="0"
                          r="25"
                          fill="none"
                          stroke="#C94A45"
                          strokeWidth="1.5"
                          opacity="0.7"
                          className="animate-pulse"
                        />
                      )}
                      {/* Main Node Circle */}
                      <circle
                        cx="0"
                        cy="0"
                        r="18"
                        fill={node.bgColor || '#FFFFFF'}
                        stroke={node.color}
                        strokeWidth="2"
                        className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.06)]"
                      />
                      <circle cx="0" cy="0" r="7" fill={node.color} />
                      
                      {/* Concept Label */}
                      <text x="0" y="30" textAnchor="middle" className="text-[10px] font-semibold fill-[#171717]">
                        {node.label}
                      </text>
                      {/* Mastery Pill */}
                      {node.score !== undefined && (
                        <text
                          x="0"
                          y="42"
                          textAnchor="middle"
                          className={`text-[8.5px] font-mono font-medium ${
                            isMastered ? 'fill-[#3F7D58]' : isWeak ? 'fill-[#C94A45]' : 'fill-[#C58A24]'
                          }`}
                        >
                          mastery: {node.score}%
                        </text>
                      )}
                    </g>
                  );
                }

                // 4. QUESTION QUERY NODE (Rose Pink Dialog Bubble from Real History)
                if (node.type === 'question') {
                  return (
                    <g
                      key={node.id}
                      ref={(el) => { if (el) nodeElementsRef.current[node.id] = el; }}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="cursor-pointer transition-all duration-150 hover:scale-105"
                      opacity={nodeOpacity}
                      onClick={() => handleNodeClick(node.id)}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="18"
                        fill="#FDF0F5"
                        stroke="#D94F83"
                        strokeWidth="2"
                        className="drop-shadow-[0_4px_12px_rgba(217,79,131,0.15)]"
                      />
                      <text x="0" y="4" textAnchor="middle" className="text-xs">
                        💬
                      </text>
                      {/* Question Text */}
                      <text
                        x="0"
                        y="30"
                        textAnchor="middle"
                        className="text-[9px] font-sans fill-[#6B6861] font-medium"
                      >
                        {node.label.length > 24 ? node.label.slice(0, 24) + '...' : node.label}
                      </text>
                    </g>
                  );
                }

                // 5. AGENT NODE (Royal Violet Robot Badge)
                if (node.type === 'agent') {
                  return (
                    <g
                      key={node.id}
                      ref={(el) => { if (el) nodeElementsRef.current[node.id] = el; }}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="cursor-pointer transition-all duration-150 hover:scale-105"
                      opacity={nodeOpacity}
                      onClick={() => handleNodeClick(node.id)}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="20"
                        fill="#F5EEFA"
                        stroke="#7657A8"
                        strokeWidth="2"
                        className="drop-shadow-[0_4px_12px_rgba(118,87,168,0.15)]"
                      />
                      <text x="0" y="5" textAnchor="middle" className="text-sm">
                        🤖
                      </text>
                      <text x="0" y="34" textAnchor="middle" className="text-[10.5px] font-bold fill-[#7657A8]">
                        {node.label}
                      </text>
                    </g>
                  );
                }

                return null;
              })}
            </svg>
          </div>


          {/* SLIDE-OUT INSPECTOR PANEL (When node is clicked - Warm Light Theme) */}
          {inspectorOpen && activeNode && (
            <div className="absolute top-0 right-0 bottom-0 w-full sm:w-96 bg-white/98 backdrop-blur-xl border-l border-[#E7E1D7] p-6 shadow-2xl z-30 overflow-y-auto animate-fade-in space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E1D7]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#A8421E] font-bold">
                  {activeNode.type ? `${activeNode.type.toUpperCase()} INSPECTOR` : 'NODE DETAILS'}
                </span>
                <button
                  type="button"
                  onClick={() => setInspectorOpen(false)}
                  className="p-1 rounded-lg hover:bg-[#F4EFE6] text-[#6B6861] hover:text-[#171717] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Hub Inspection */}
              {activeNode.type === 'hub' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-[#171717]">Student Learning Hub</h3>
                    <p className="text-xs text-[#6B6861] mt-1">
                      Central knowledge locus tracking cross-disciplinary mastery growth across 4 distinct domains.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E7E1D7] font-mono text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#6B6861]">Total Interactions:</span>
                      <span className="text-[#171717] font-bold">{activeNode.interactions ?? 0} turns</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B6861]">Domains Active:</span>
                      <span className="text-[#3F7D58] font-bold">{activeNode.subjects ?? 0} subjects</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B6861]">Concepts Mapped:</span>
                      <span className="text-[#7657A8] font-bold">{activeNode.concepts ?? 0} key concepts</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Subject Hub Inspection */}
              {activeNode.type === 'subject' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F3] border border-[#E7E1D7] flex items-center justify-center text-xl shadow-xs">
                      {activeNode.symbol}
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#171717]">{activeNode.label.replace('\n', ' ')}</h3>
                      <span className="text-[10px] font-mono text-[#6B6861] uppercase">Core Discipline Hub</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#6B6861] leading-relaxed">
                    Probabilistic curriculum cluster containing foundational prerequisites and target capstone models.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/app/tutor?agent=${activeNode.id.replace('subj_', '')}`)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#A8421E] hover:bg-[#8E3516] text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Practice with {activeNode.label.replace('\n', ' ')} Tutor</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Concept Node Inspection */}
              {activeNode.type === 'concept' && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#3F7D58] font-semibold">
                      {activeNode.subject?.toUpperCase()} CONCEPT
                    </span>
                    <h3 className="text-xl font-serif font-bold text-[#171717] mt-0.5">{activeNode.label}</h3>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E7E1D7] space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#6B6861]">Mastery Index:</span>
                      <span className="font-bold text-[#171717]">{activeNode.score}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#E7E1D7] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${activeNode.score}%`,
                          backgroundColor: activeNode.color || '#3F7D58',
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-[#6B6861] pt-1">
                      <span>State: <strong className="uppercase text-[#171717]">{activeNode.state}</strong></span>
                      <span>{activeNode.metadata?.attempts ? `${activeNode.metadata.attempts} attempts` : 'No attempts yet'}</span>
                    </div>
                  </div>

                  {activeNode.state === 'weak' && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-[#C94A45] flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Identified prerequisite bottleneck. Reinforce this concept to unlock capstones.</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate(`/app/tutor?concept=${encodeURIComponent(activeNode.id)}`)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#A8421E] hover:bg-[#8E3516] text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Launch Socratic Drill on {activeNode.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Question Query Inspection */}
              {activeNode.type === 'question' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D94F83] font-semibold">
                    Logged Student Query
                  </span>
                  <h3 className="text-lg font-serif italic text-[#171717]">
                    "{activeNode.label}"
                  </h3>
                  <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E7E1D7] space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#6B6861]">Assigned Agent:</span>
                      <span className="text-[#7657A8] font-bold uppercase">{activeNode.agent || 'Coordinator'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B6861]">Domain:</span>
                      <span className="text-[#171717] uppercase">{activeNode.subject}</span>
                    </div>
                  </div>
                  <Link
                    to="/app/history"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#FAF8F3] hover:bg-[#F4EFE6] text-[#171717] text-xs font-semibold border border-[#E7E1D7] flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4 text-[#D94F83]" />
                    <span>Open in Conversation History</span>
                  </Link>
                </div>
              )}

              {/* Agent Node Inspection */}
              {activeNode.type === 'agent' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F5EEFA] border border-[#A284D1] flex items-center justify-center text-xl shadow-xs">
                      🤖
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#171717]">{activeNode.label}</h3>
                      <span className="text-[10px] font-mono text-[#7657A8] uppercase">Specialist Faculty Tutor</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#6B6861] leading-relaxed">
                    Collaborates with the Bayesian Coordinator to provide Socratic guidance and root-cause prerequisite repair.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/app/tutor?agent=${activeNode.subject}`)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#A8421E] hover:bg-[#8E3516] text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Ask {activeNode.label} in Tutor</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default function KnowledgeMap() {
  return (
    <KnowledgeMapErrorBoundary>
      <KnowledgeMapContent />
    </KnowledgeMapErrorBoundary>
  );
}

