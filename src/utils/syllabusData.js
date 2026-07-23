/**
 * Official GATE Computer Science & Information Technology Syllabus (GATE 2027)
 */
export const syllabusData = [
  {
    id: 'em_dm',
    name: 'Section 1: Engineering Mathematics',
    subtopics: [
      { id: 'em_discrete_logic', name: 'Discrete Mathematics: Propositional and first order logic' },
      { id: 'em_discrete_sets', name: 'Sets, relations, functions, partial orders and lattices, Monoids, Groups' },
      { id: 'em_discrete_graphs', name: 'Graphs: connectivity, matching, colouring' },
      { id: 'em_discrete_comb', name: 'Combinatorics: counting, recurrence relations, generating functions' },
      { id: 'em_linear_matrices', name: 'Linear Algebra: Matrices, determinants, system of linear equations, eigenvalues and eigenvectors, LU decomposition' },
      { id: 'em_calculus', name: 'Calculus: Limits, continuity and differentiability, Maxima and minima, Mean value theorem, Integration' },
      { id: 'em_probability_stats', name: 'Probability & Stats: Random variables, Uniform, normal, exponential, Poisson and binomial distributions, Mean, median, mode and standard deviation, Conditional probability and Bayes theorem' }
    ]
  },
  {
    id: 'dl',
    name: 'Section 2: Digital Logic',
    subtopics: [
      { id: 'dl_boolean_minimization', name: 'Boolean algebra and minimization - algebraic technique, Karnaugh map, tabular method' },
      { id: 'dl_combinational_sequential', name: 'Design of combinational and sequential circuits' },
      { id: 'dl_number_arithmetic', name: 'Number representation and arithmetic (fixed and floating point)' }
    ]
  },
  {
    id: 'coa',
    name: 'Section 3: Computer Organization and Architecture',
    subtopics: [
      { id: 'coa_instruction_addressing', name: 'Instruction set and addressing modes' },
      { id: 'coa_alu_design', name: 'Design of arithmetic and logic unit (ALU)' },
      { id: 'coa_control_unit', name: 'Design of control unit - hardwired and microprogrammed' },
      { id: 'coa_memory_hierarchy', name: 'Memory interfacing and hierarchy: performance, cache memory mapping' },
      { id: 'coa_io_interface', name: 'I/O interface (interrupt and DMA)' },
      { id: 'coa_pipelining_hazards', name: 'Instruction pipelining, pipeline hazards' }
    ]
  },
  {
    id: 'pds',
    name: 'Section 4: Programming and Data Structures',
    subtopics: [
      { id: 'pds_c_recursion', name: 'Programming in C. Recursion' },
      { id: 'pds_data_structures', name: 'Arrays, stacks, queues, linked lists, trees, binary search trees, binary heaps, graphs' }
    ]
  },
  {
    id: 'algo',
    name: 'Section 5: Algorithms',
    subtopics: [
      { id: 'algo_searching_sorting', name: 'Searching, sorting, hashing' },
      { id: 'algo_complexity', name: 'Asymptotic worst case time and space complexity' },
      { id: 'algo_design_tech', name: 'Algorithm design techniques: greedy, dynamic programming and divide-and-conquer' },
      { id: 'algo_graph_traversal', name: 'Graph traversals, minimum spanning trees, shortest paths' }
    ]
  },
  {
    id: 'toc',
    name: 'Section 6: Theory of Computation',
    subtopics: [
      { id: 'toc_regular_automata', name: 'Regular expressions and finite automata' },
      { id: 'toc_cfg_pda', name: 'Context-free grammars and push-down automata' },
      { id: 'toc_languages_lemma', name: 'Regular and context-free languages, pumping lemma' },
      { id: 'toc_turing_undecidability', name: 'Turing machines and undecidability' }
    ]
  },
  {
    id: 'cd',
    name: 'Section 7: Compiler Design',
    subtopics: [
      { id: 'cd_lexical_parsing', name: 'Lexical analysis, parsing, syntax-directed translation' },
      { id: 'cd_runtime_environments', name: 'Runtime environments' },
      { id: 'cd_intermediate_code', name: 'Intermediate code generation' },
      { id: 'cd_optimization_flow', name: 'Local optimisation, Data flow analyses: constant propagation, liveness analysis, common sub expression elimination' }
    ]
  },
  {
    id: 'os',
    name: 'Section 8: Operating System',
    subtopics: [
      { id: 'os_process_threads', name: 'System calls, processes, threads, inter-process communication, concurrency and synchronization' },
      { id: 'os_deadlocks', name: 'Deadlock' },
      { id: 'os_scheduling', name: 'CPU and I/O scheduling' },
      { id: 'os_memory_virtual', name: 'Memory management and virtual memory' },
      { id: 'os_file_systems', name: 'File systems' }
    ]
  },
  {
    id: 'dbms',
    name: 'Section 9: Databases',
    subtopics: [
      { id: 'dbms_er_model', name: 'ER-model' },
      { id: 'dbms_relational_sql', name: 'Relational model: relational algebra, tuple calculus, SQL' },
      { id: 'dbms_integrity_normal', name: 'Integrity constraints, normal forms' },
      { id: 'dbms_file_indexing', name: 'File organization, indexing (e.g., B and B+ trees)' },
      { id: 'dbms_transaction_concurrency', name: 'Transactions and concurrency control' }
    ]
  },
  {
    id: 'cn',
    name: 'Section 10: Computer Networks',
    subtopics: [
      { id: 'cn_layering_switching', name: 'Principles of Layering; Basics of switching (circuit, packet and virtual circuit) and performance metrics' },
      { id: 'cn_link_mac', name: 'Data link layer: error detection, Medium Access Control, Ethernet' },
      { id: 'cn_routing', name: 'Distance vector and link state routing' },
      { id: 'cn_ip_nat', name: 'IPv4 - Fragmentation, CIDR Notation, Network Address Translation' },
      { id: 'cn_tcp_flow', name: 'TCP - flow control and congestion control, socket API' },
      { id: 'cn_dns_http', name: 'DNS and HTTP' }
    ]
  }
];

// Helper to look up a subtopic name by ID
export function getSubtopicName(id) {
  for (const subject of syllabusData) {
    const subtopic = subject.subtopics.find(st => st.id === id);
    if (subtopic) return subtopic.name;
  }
  return 'Unknown Topic';
}

// Helper to get all subtopics flattened
export function getAllSubtopics() {
  return syllabusData.reduce((acc, subject) => {
    return acc.concat(subject.subtopics);
  }, []);
}
