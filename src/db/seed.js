const db = require('./index');

const EXAMS = [
  {
    title: 'Computer Science Exit Exam Preparation',
    department: 'Computer Science',
    price: 150,
    duration: 60,
    description:
      'Complete revision package covering Data Structures, DBMS, Operating Systems, Networking and Object-Oriented Programming with timed mock questions and detailed explanations.',
    document: `COMPUTER SCIENCE EXIT EXAM - STUDY DOCUMENT

1. DATA STRUCTURES
- Stack: Last-In-First-Out (LIFO). Used in recursion, expression evaluation and undo operations.
- Queue: First-In-First-Out (FIFO). Used in scheduling, buffering and BFS traversal.
- Linked List: Dynamic collection of nodes connected by pointers; efficient insertion/deletion, sequential access.
- Tree: Hierarchical structure. A Binary Search Tree keeps left child < parent < right child.
- Graph: Vertices connected by edges; traversed using BFS (queue) or DFS (stack/recursion).

2. ALGORITHM COMPLEXITY
- Binary search on a sorted array of n elements: O(log n).
- Linear search: O(n).
- Merge sort and heap sort: O(n log n).
- Bubble sort worst case: O(n^2).

3. DATABASE MANAGEMENT SYSTEMS
- DDL commands: CREATE, ALTER, DROP, TRUNCATE - they change the structure of database objects.
- DML commands: SELECT, INSERT, UPDATE, DELETE - they manipulate data.
- Normalization reduces redundancy. 1NF removes repeating groups, 2NF removes partial dependency, 3NF removes transitive dependency.
- ACID = Atomicity, Consistency, Isolation, Durability.

4. OPERATING SYSTEMS
- Process states: new, ready, running, waiting, terminated.
- FCFS and SJF are non-preemptive; Round Robin and Priority (preemptive) are preemptive.
- Deadlock requires mutual exclusion, hold and wait, no preemption and circular wait.
- Paging divides memory into fixed-size frames to eliminate external fragmentation.

5. COMPUTER NETWORKS
- OSI layers (bottom to top): Physical, Data Link, Network, Transport, Session, Presentation, Application.
- IP works at the Network layer; TCP/UDP work at the Transport layer.
- TCP is connection-oriented and reliable; UDP is connectionless and faster.

6. OBJECT-ORIENTED PROGRAMMING
- Encapsulation hides internal state and exposes behaviour through methods.
- Inheritance allows a class to reuse the members of another class.
- Polymorphism lets the same interface represent different implementations.`,
    questions: [
      ['Which data structure follows the First-In-First-Out (FIFO) principle?', 'Stack', 'Queue', 'Binary Tree', 'Graph', 'B', 'A queue inserts at the rear and removes from the front, so the first element added is the first removed (FIFO). A stack is LIFO.'],
      ['Which SQL command removes a table structure together with its data?', 'DELETE', 'REMOVE', 'DROP', 'TRUNCATE', 'C', 'DROP removes the entire table definition and its data. DELETE removes rows only and TRUNCATE removes rows but keeps the table structure.'],
      ['What is the worst-case time complexity of binary search on a sorted array?', 'O(1)', 'O(n)', 'O(log n)', 'O(n log n)', 'C', 'Binary search halves the search space on every step, giving O(log n) comparisons.'],
      ['Which CPU scheduling algorithm is non-preemptive?', 'Round Robin', 'First Come First Served (FCFS)', 'Preemptive Priority', 'Shortest Remaining Time First', 'B', 'FCFS lets a process run to completion once it starts, so it is non-preemptive. Round Robin, preemptive Priority and SRTF can be preempted.'],
      ['Which OOP principle means hiding internal details and exposing only necessary behaviour?', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction', 'C', 'Encapsulation bundles data and the methods that operate on it, restricting direct access to the internal state.'],
    ],
  },
  {
    title: 'Nursing Exit Exam Preparation',
    department: 'Nursing',
    price: 150,
    duration: 60,
    description:
      'Focused revision for the national nursing exit examination covering fundamentals, pharmacology, maternal health, infection control and emergency care.',
    document: `NURSING EXIT EXAM - STUDY DOCUMENT

1. FUNDAMENTALS OF NURSING
- Normal adult resting values: respiratory rate 12-20/min, pulse 60-100 bpm, temperature 36.5-37.5 C.
- The nursing process steps: Assessment, Diagnosis, Planning, Implementation, Evaluation (ADPIE).
- Vital signs are assessed on admission, before and after procedures and whenever the patient's condition changes.

2. INFECTION CONTROL
- The single most effective way to prevent infection is proper hand hygiene.
- Standard precautions are applied to every patient regardless of diagnosis.
- Sterile technique is required for wound care, catheter insertion and surgical procedures.

3. PHARMACOLOGY
- Digoxin toxicity signs: nausea, vomiting, visual disturbances and bradycardia.
- Warfarin is monitored using INR; the antidote is vitamin K.
- Paracetamol overdose is treated with N-acetylcysteine.
- Before giving any drug, follow the five rights: right patient, drug, dose, route and time.

4. MATERNAL AND CHILD HEALTH
- The four stages of labour: first (dilation), second (expulsion of the baby), third (delivery of the placenta) and fourth (recovery).
- A new-born's Apgar score is assessed at 1 and 5 minutes after birth.
- Exclusive breastfeeding is recommended for the first six months of life.

5. EMERGENCY AND CRITICAL CARE
- Cardiopulmonary resuscitation for an adult uses a compression:ventilation ratio of 30:2.
- Effective chest compressions should be at least 5 cm deep and 100-120 per minute.
- The triage colour red identifies patients who need immediate life-saving treatment.`,
    questions: [
      ['What is the single most effective measure to prevent the spread of infection?', 'Wearing gloves', 'Hand hygiene', 'Isolating all patients', 'Using antibiotics', 'B', 'Proper hand hygiene before and after contact with patients is the single most effective way to prevent healthcare-associated infection.'],
      ['Which vital sign value is within the normal range for a healthy adult?', 'Respiratory rate of 8/min', 'Pulse of 130 bpm', 'Temperature of 37.0 C', 'Blood pressure of 160/100 mmHg', 'C', 'A temperature of 37.0 C is normal. Respiratory rate 8/min, pulse 130 bpm and BP 160/100 mmHg all fall outside normal adult ranges.'],
      ['Which drug is the antidote for warfarin overdose?', 'Protamine sulphate', 'Vitamin K', 'N-acetylcysteine', 'Naloxone', 'B', 'Vitamin K reverses the anticoagulant effect of warfarin. Protamine reverses heparin, N-acetylcysteine is for paracetamol and naloxone is for opioids.'],
      ['During adult cardiopulmonary resuscitation, what is the recommended compression to ventilation ratio?', '15:2', '30:2', '5:1', '10:1', 'B', 'Adult CPR uses 30 chest compressions to 2 rescue breaths, with compressions 5-6 cm deep at 100-120 per minute.'],
      ['A new-born Apgar score is recorded at which times after birth?', '1 and 5 minutes', '5 and 10 minutes', '10 and 20 minutes', 'Only at 1 minute', 'A', 'The Apgar score is assessed at 1 minute and again at 5 minutes after delivery to evaluate the baby\'s adaptation.'],
    ],
  },
  {
    title: 'Accounting and Finance Exit Exam Preparation',
    department: 'Accounting and Finance',
    price: 150,
    duration: 60,
    description:
      'Revision package for accounting and finance students covering the accounting cycle, financial statements, costing, auditing and financial management.',
    document: `ACCOUNTING AND FINANCE EXIT EXAM - STUDY DOCUMENT

1. THE ACCOUNTING EQUATION AND CYCLE
- Assets = Liabilities + Owner's Equity.
- Debits increase assets and expenses; credits increase liabilities, equity and revenue.
- The accounting cycle: transactions, journal, ledger, trial balance, adjusting entries, financial statements, closing entries.

2. FINANCIAL STATEMENTS
- The income statement reports revenues and expenses over a period.
- The balance sheet reports assets, liabilities and equity at a point in time.
- The statement of cash flows is divided into operating, investing and financing activities.

3. COST AND MANAGEMENT ACCOUNTING
- Fixed costs do not change with output; variable costs vary with output.
- Contribution margin = sales - variable costs.
- Break-even point (units) = fixed costs / contribution margin per unit.

4. FINANCIAL MANAGEMENT
- Working capital = current assets - current liabilities.
- The time value of money principle states that a birr today is worth more than a birr in the future.
- Net Present Value (NPV) is the preferred capital budgeting technique; a positive NPV is acceptable.

5. AUDITING AND INTERNAL CONTROL
- The purpose of an audit is to express an opinion on whether the financial statements are fairly presented.
- Segregation of duties, authorization and physical controls are key internal controls.
- Materiality and audit risk guide the extent of audit testing.`,
    questions: [
      ['Which of the following is the correct accounting equation?', 'Assets = Liabilities - Equity', 'Assets = Liabilities + Equity', 'Equity = Assets + Liabilities', 'Liabilities = Assets + Equity', 'B', 'The fundamental accounting equation is Assets = Liabilities + Owner\'s Equity, which must always balance.'],
      ['Which financial statement reports the financial position of a business at a specific point in time?', 'Income statement', 'Balance sheet', 'Statement of cash flows', 'Trial balance', 'B', 'The balance sheet presents assets, liabilities and equity as of a specific date, whereas the income statement covers a period.'],
      ['What is the break-even point in units if fixed costs are 10,000 birr and contribution margin per unit is 50 birr?', '100 units', '200 units', '500 units', '50 units', 'B', 'Break-even units = fixed costs / contribution margin per unit = 10,000 / 50 = 200 units.'],
      ['Which capital budgeting method is preferred because it considers the time value of money?', 'Payback period', 'Accounting rate of return', 'Net Present Value (NPV)', 'Gross profit margin', 'C', 'NPV discounts future cash flows to their present value and is preferred because it accounts for the time value of money.'],
      ['Segregation of duties is a principle used primarily to:', 'Increase sales', 'Reduce the risk of error and fraud', 'Reduce tax liability', 'Speed up financial reporting', 'B', 'Separating authorization, custody and recording prevents any single person from controlling a transaction and reduces the risk of error and fraud.'],
    ],
  },
  {
    title: 'Law Exit Exam Preparation',
    department: 'Law',
    price: 150,
    duration: 60,
    description:
      'Revision material for law students covering constitutional law, contracts, criminal law, torts and the Ethiopian legal system.',
    document: `LAW EXIT EXAM - STUDY DOCUMENT

1. CONSTITUTIONAL LAW
- The Ethiopian Constitution establishes a federal system with federal and regional state governments.
- Separation of powers divides authority among legislative, executive and judicial branches.
- Judicial review allows courts to examine the constitutionality of laws.

2. LAW OF CONTRACTS
- A valid contract requires offer, acceptance, consideration and legal capacity.
- The intention to create legal relations is presumed in commercial agreements.
- A contract is void if its object is illegal or impossible.
- Misrepresentation vitiates consent and may make a contract voidable.

3. CRIMINAL LAW
- The principle of legality (nullum crimen sine lege) requires that crimes be defined by law before commission.
- Criminal liability generally requires actus reus and mens rea.
- Necessity, self-defence and duress are defences excusing otherwise unlawful conduct.

4. LAW OF TORTS
- Negligence requires a duty of care, breach of that duty, causation and damage.
- Defamation is the publication of a false statement that harms another's reputation.
- Vicarious liability holds an employer liable for acts committed by employees in the course of employment.

5. ETHIOPIAN LEGAL SYSTEM
- The Federal Supreme Court is the highest court and exercises cassation jurisdiction.
- Customary and religious laws operate in certain personal and family matters.`,
    questions: [
      ['Under the Ethiopian Constitution, the highest court exercising cassation jurisdiction is the:', 'Federal High Court', 'Federal Supreme Court', 'Regional Supreme Court', 'First Instance Court', 'B', 'The Federal Supreme Court is the highest court in Ethiopia and exercises cassation jurisdiction over federal and regional matters.'],
      ['Which of the following is NOT a requirement for a valid contract?', 'Offer and acceptance', 'Consideration', 'Capacity to contract', 'A written notarised document', 'D', 'A notarised document is not generally required for validity. Offer, acceptance, consideration and capacity are the essential elements.'],
      ['The principle of legality means that:', 'Ignorance of the law is a defence', 'A person can be punished only for an act defined as a crime at the time it was committed', 'All laws apply retroactively', 'Criminal laws can be applied by analogy', 'B', 'Nullum crimen sine lege requires a crime to be defined by law before it is committed and prohibits retrospective or analogous application.'],
      ['Which elements must a plaintiff prove in a negligence claim?', 'Intention, motive and harm', 'Duty, breach, causation and damage', 'Offer, acceptance and consideration', 'Actus reus and mens rea', 'B', 'Negligence requires proof of a duty of care, a breach of that duty, causation and resulting damage.'],
      ['Vicarious liability makes which party responsible for an employee\'s tort committed in the course of employment?', 'The employee only', 'The employer', 'The client', 'The state', 'B', 'Under vicarious liability an employer is liable for torts committed by employees during the course of their employment.'],
    ],
  },
  {
    title: 'Civil Engineering Exit Exam Preparation',
    department: 'Civil Engineering',
    price: 150,
    duration: 60,
    description:
      'Revision package for civil engineering students covering structural analysis, concrete, geotechnics, surveying, hydraulics and construction management.',
    document: `CIVIL ENGINEERING EXIT EXAM - STUDY DOCUMENT

1. STRUCTURAL ANALYSIS
- A simply supported beam is statically determinate; a fixed beam is indeterminate.
- Bending moment is maximum where shear force is zero.
- Euler's formula gives the buckling load of a slender column: Pcr = pi^2 EI / L^2.

2. CONCRETE AND MATERIALS
- Concrete strength is specified by the cylinder or cube compressive strength at 28 days.
- The water-cement ratio strongly influences concrete strength and durability.
- Steel reinforcement resists tensile stresses that concrete cannot.

3. GEOTECHNICAL ENGINEERING
- Effective stress = total stress - pore water pressure.
- The standard penetration test (SPT) is used to estimate soil bearing capacity.
- The angle of internal friction and cohesion define the shear strength of soil.

4. SURVEYING
- Levelling determines elevation differences; the levelling instrument is set on a tripod.
- A total station measures horizontal and vertical angles and distances.
- Contour lines on a map connect points of equal elevation.

5. HYDRAULICS
- Bernoulli's equation expresses conservation of energy in flowing fluids.
- Flow is classified as laminar or turbulent based on the Reynolds number.
- Manning's equation estimates velocity in open channels.

6. CONSTRUCTION MANAGEMENT
- The critical path in a network is the longest duration path and determines project duration.
- Float is the amount of time an activity can be delayed without delaying the project.`,
    questions: [
      ['The bending moment in a beam is maximum at the section where:', 'Shear force is maximum', 'Shear force is zero', 'The beam is supported', 'Deflection is maximum', 'B', 'Bending moment reaches a maximum (or minimum) where the shear force changes sign, that is where shear force is zero.'],
      ['The buckling load of a slender column is given by which formula?', 'F = ma', 'Pcr = pi^2 EI / L^2', 'P = rho g h', 'Q = AV', 'B', 'Euler\'s buckling formula gives the critical load as Pcr = pi^2 EI / L^2 for a pin-ended slender column.'],
      ['Effective stress in a saturated soil is calculated as:', 'Total stress + pore water pressure', 'Total stress - pore water pressure', 'Pore water pressure - total stress', 'Total stress x pore water pressure', 'B', 'Terzaghi\'s principle defines effective stress as total stress minus pore water pressure, and it controls soil behaviour.'],
      ['Which of the following tests is commonly used to estimate the bearing capacity of soil in the field?', 'Standard Penetration Test (SPT)', 'Slump test', 'Sieve analysis', 'Splitting tensile test', 'A', 'The Standard Penetration Test measures soil resistance and is widely used to estimate bearing capacity and relative density.'],
      ['In project scheduling, the critical path is:', 'The shortest path through the network', 'The longest duration path that determines project duration', 'A path with the largest float', 'The cheapest sequence of activities', 'B', 'The critical path is the longest duration path through the network; any delay on it delays the whole project and it has zero float.'],
    ],
  },
];

function seed() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM exams').get().c;
  if (count > 0) return false;

  const insertExam = db.prepare(
    'INSERT INTO exams (title, department, price, duration, description, document) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertQuestion = db.prepare(
    `INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const exam of EXAMS) {
    const info = insertExam.run(
      exam.title,
      exam.department,
      exam.price,
      exam.duration,
      exam.description,
      exam.document
    );
    const examId = Number(info.lastInsertRowid);
    exam.questions.forEach((q, index) => {
      const [text, a, b, c, d, correct, explanation] = q;
      insertQuestion.run(examId, text, a, b, c, d, correct, explanation, index + 1);
    });
  }
  return true;
}

module.exports = seed;
