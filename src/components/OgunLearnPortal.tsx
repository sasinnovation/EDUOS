import React, { useState } from "react";
import { 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  ArrowLeft, 
  Trophy, 
  Clock, 
  FileText,
  AlertCircle,
  GraduationCap
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  classLevel: string;
  description: string;
  topics: {
    title: string;
    objectives: string;
    notes: string;
    quiz: {
      question: string;
      options: string[];
      correct: number;
      explanation: string;
    }[];
  }[];
}

const OGUNLEARN_CURRICULUM: Subject[] = [
  {
    id: "sub-1",
    name: "General Mathematics",
    classLevel: "SS3 Science & Arts",
    description: "Unified curriculum preparing students for WASSCE/NECO mathematics assessments.",
    topics: [
      {
        title: "Quadratic Equations & Algebra",
        objectives: "Apply factorization, standard quadratic formulas, and algebraic inequalities.",
        notes: "A quadratic equation is in the form ax² + bx + c = 0, where a ≠ 0. The Almighty Formula is x = [-b ± √(b² - 4ac)] / (2a). The term b² - 4ac is called the discriminant. If > 0, we have two real distinct roots; if = 0, we have equal roots; if < 0, we have complex/imaginary roots.",
        quiz: [
          {
            question: "Find the roots of the equation x² - 5x + 6 = 0.",
            options: ["x = 2 and x = 3", "x = -2 and x = -3", "x = 1 and x = 5", "x = -1 and x = 6"],
            correct: 0,
            explanation: "Factoring gives (x - 2)(x - 3) = 0, hence x = 2 or x = 3."
          },
          {
            question: "What is the discriminant of the equation x² + 4x + 4 = 0?",
            options: ["16", "8", "0", "-4"],
            correct: 2,
            explanation: "Discriminant = b² - 4ac = 4² - 4(1)(4) = 16 - 16 = 0. This means the equation has equal roots."
          },
          {
            question: "Which formula is popularly referred to as the 'Almighty Formula' in Nigerian secondary mathematics?",
            options: ["Sine Rule", "Quadratic Formula", "Euler's Identity", "Cosine Rule"],
            correct: 1,
            explanation: "The quadratic formula is universally referred to as the Almighty Formula in Nigerian math classrooms."
          }
        ]
      },
      {
        title: "Trigonometric Identities & Graphs",
        objectives: "Deduce sine, cosine and tangent ratios for angles up to 360 degrees.",
        notes: "Remember the SOH CAH TOA rules. Standard identities include sin²θ + cos²θ = 1, tan θ = sin θ / cos θ. For non-right-angled triangles, we use the Sine Rule: a/sin A = b/sin B = c/sin C and Cosine Rule: a² = b² + c² - 2bc cos A.",
        quiz: [
          {
            question: "Evaluate sin 150° using trigonometric ratios.",
            options: ["0.5", "-0.5", "0.866", "-0.866"],
            correct: 0,
            explanation: "sin 150° is in the second quadrant. sin(180° - 30°) = sin 30° = 0.5."
          },
          {
            question: "If sin θ = 3/5 in the first quadrant, find cos θ.",
            options: ["4/5", "3/4", "5/4", "1"],
            correct: 0,
            explanation: "Using sin²θ + cos²θ = 1, cos θ = √(1 - 9/25) = √(16/25) = 4/5."
          }
        ]
      }
    ]
  },
  {
    id: "sub-2",
    name: "English Language",
    classLevel: "SS3 General",
    description: "Core syllabus covering lexis and structure, essay writing rules, and oral English drills.",
    topics: [
      {
        title: "Concord Rules & Subject-Verb Agreement",
        objectives: "Master the rules governing singular/plural subjects and their corresponding verbs.",
        notes: "Concord refers to agreement between words. Basic rules: 1. Singular subjects take singular verbs ('The boy runs'). 2. Plural subjects take plural verbs ('The boys run'). 3. When subjects are connected by 'either... or' or 'neither... nor', the verb agrees with the subject closest to it.",
        quiz: [
          {
            question: "Neither the teacher nor the students ____ present at the briefing yesterday.",
            options: ["was", "were", "is", "are"],
            correct: 1,
            explanation: "The closest subject to the verb is 'the students' (plural), so the plural past tense 'were' is used."
          },
          {
            question: "The director, along with his security guards, ____ arriving at the secretariat.",
            options: ["is", "are", "have been", "were"],
            correct: 0,
            explanation: "The phrase 'along with...' does not make the subject plural. The main subject 'The director' is singular, hence 'is'."
          }
        ]
      }
    ]
  },
  {
    id: "sub-3",
    name: "Physics",
    classLevel: "SS3 Science",
    description: "In-depth mechanical, thermal, electrical waves and modern quantum physics modules.",
    topics: [
      {
        title: "Electric Fields & Coulomb's Law",
        objectives: "Describe electric force interaction and compute electrostatic potentials.",
        notes: "Coulomb's Law states that the electrostatic force (F) between two point charges (q₁, q₂) is directly proportional to the product of the charges and inversely proportional to the square of the distance (r) between them. Formula: F = k(q₁q₂) / r².",
        quiz: [
          {
            question: "What is the SI unit of electric field intensity?",
            options: ["Coulomb", "Newton per Coulomb (N/C)", "Volt", "Ampere"],
            correct: 1,
            explanation: "Electric field E = Force / Charge, hence Newton per Coulomb."
          },
          {
            question: "If the distance between two charges is doubled, the force between them is:",
            options: ["Doubled", "Halved", "Quadrupled", "Quartered"],
            correct: 3,
            explanation: "Force is inversely proportional to r². (2)² = 4, so force becomes F/4 (Quartered)."
          }
        ]
      }
    ]
  }
];

export default function OgunLearnPortal() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  
  // Quiz states
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  const handleStartTopic = (topic: any) => {
    setSelectedTopic(topic);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const handleSelectOption = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleSubmitQuiz = () => {
    if (!selectedTopic) return;
    let score = 0;
    selectedTopic.quiz.forEach((q: any, idx: number) => {
      if (quizAnswers[idx] === q.correct) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  return (
    <div className="space-y-6" id="ogunlearn-portal-container">
      
      {/* Official Ogun State Banner Branding Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-yellow-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-6 translate-x-6">
          <GraduationCap className="h-64 w-64" />
        </div>
        
        <div className="flex items-center space-x-3 mb-2">
          <span className="bg-yellow-500 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded font-mono uppercase tracking-widest">
            EduOS Study Portal
          </span>
          <span className="text-xs font-semibold text-emerald-100 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-yellow-300" /> Curated WASSCE/NECO Standard Course Syllabus
          </span>
        </div>
        
        <h2 className="text-2xl font-black tracking-tight md:text-3xl">
          Syllabus Study & Revision Center
        </h2>
        <p className="text-emerald-100 text-xs md:text-sm mt-1 max-w-xl font-medium">
          Access unified school e-curriculum resources, digital continuous assessment notebooks, and localized mock exercises.
        </p>
      </div>

      {/* Main content switch */}
      {!selectedTopic ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Subject Grid */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm font-mono tracking-wider uppercase">
              Select Curated Subject Curriculum
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OGUNLEARN_CURRICULUM.map((subject) => {
                const isSelected = selectedSubject?.id === subject.id;
                return (
                  <div 
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject)}
                    className={`border p-5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between h-48 group ${
                      isSelected 
                        ? "border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500" 
                        : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-xl">
                          {subject.classLevel}
                        </span>
                        <BookOpen className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <h4 className="font-extrabold text-slate-800 group-hover:text-emerald-700 transition-colors">
                        {subject.name}
                      </h4>
                      <p className="text-slate-400 text-xs mt-1 line-clamp-3">
                        {subject.description}
                      </p>
                    </div>

                    <div className="text-xs font-bold text-emerald-700 mt-2 flex items-center gap-1">
                      <span>View {subject.topics.length} Approved Lessons</span>
                      <span>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Topics Selector for Selected Subject */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-800 text-sm">
                {selectedSubject ? `${selectedSubject.name} Syllabus` : "Syllabus Content Drawer"}
              </h4>
              <p className="text-xs text-slate-400">
                {selectedSubject ? "Choose a unified lesson plan topic to start learning." : "Select a subject from the grid on the left."}
              </p>
            </div>

            {selectedSubject ? (
              <div className="space-y-3">
                {selectedSubject.topics.map((topic, index) => (
                  <div 
                    key={index}
                    className="border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-200 p-4 rounded-2xl transition-all cursor-pointer group"
                    onClick={() => handleStartTopic(topic)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] font-black text-emerald-600 block uppercase">
                          Lesson Module {index + 1}
                        </span>
                        <h5 className="font-bold text-slate-800 text-xs group-hover:text-emerald-700 transition-colors">
                          {topic.title}
                        </h5>
                        <p className="text-slate-400 text-[11px] line-clamp-2">
                          {topic.objectives}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-500 border-t border-slate-100/70 pt-2 group-hover:text-emerald-700">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Study Notes
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {topic.quiz.length} MCQs Quiz
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                <BookOpen className="h-10 w-10 mb-2 stroke-1" />
                <span className="text-xs font-mono font-bold">No active subject selected</span>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* ACTIVE TOPIC LEARNING AND QUIZ VIEW */
        <div className="space-y-6">
          
          {/* Navigation and Back Header */}
          <button
            onClick={() => setSelectedTopic(null)}
            className="flex items-center space-x-1 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Course Syllabus</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1 & 2: Curated Topic Lecture/Study Note Notes */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="space-y-1 border-b border-slate-100 pb-4">
                <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                  Active Digital Lesson
                </span>
                <h3 className="text-xl font-black text-slate-800 mt-2">
                  {selectedTopic.title}
                </h3>
              </div>

              {/* Lesson Objectives */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <div className="space-y-1">
                  <h5 className="font-extrabold text-emerald-800 text-xs">Standardized Learning Objectives:</h5>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {selectedTopic.objectives}
                  </p>
                </div>
              </div>

              {/* Detailed Chapter notes */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  <span>Module Study Guide & Explanatory Lecture Notes</span>
                </h4>
                <div className="text-slate-600 text-sm leading-relaxed p-5 bg-slate-50 rounded-2xl border border-slate-100 font-medium whitespace-pre-wrap">
                  {selectedTopic.notes}
                </div>
              </div>

              {/* Study Completed Checkbox Indicator */}
              <div className="flex items-center space-x-3 p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <span className="font-bold text-xs text-emerald-800 block">Unified Lesson Content Verified</span>
                  <span className="text-[10px] text-slate-400">This topic notes covers 100% of the WAEC/NECO syllabus parameters.</span>
                </div>
              </div>
            </div>

            {/* Column 3: Localized Interactive Practice Quiz */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 h-fit">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-yellow-500" />
                  <span>Topic Mastery Practice Quiz</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Test your knowledge of the lecture material immediately to consolidate your grade points.
                </p>
              </div>

              <div className="space-y-5">
                {selectedTopic.quiz.map((q: any, idx: number) => {
                  const answered = quizAnswers[idx] !== undefined;
                  const isCorrect = quizAnswers[idx] === q.correct;
                  return (
                    <div key={idx} className="space-y-2 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                      <h5 className="font-bold text-slate-700 text-xs flex items-start gap-1">
                        <span className="font-mono text-emerald-600 font-extrabold">{idx + 1}.</span>
                        <span>{q.question}</span>
                      </h5>

                      <div className="space-y-1.5">
                        {q.options.map((opt: string, oIdx: number) => {
                          const selected = quizAnswers[idx] === oIdx;
                          let optClass = "border-slate-100 hover:bg-slate-50";
                          if (selected) {
                            optClass = "border-emerald-600 bg-emerald-50/50 text-emerald-800 font-bold";
                          }
                          if (quizSubmitted) {
                            if (oIdx === q.correct) {
                              optClass = "border-emerald-500 bg-emerald-100 text-emerald-900 font-extrabold";
                            } else if (selected && !isCorrect) {
                              optClass = "border-rose-300 bg-rose-50 text-rose-950 line-through";
                            } else {
                              optClass = "border-slate-100 opacity-60";
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={quizSubmitted}
                              onClick={() => handleSelectOption(idx, oIdx)}
                              className={`w-full text-left p-2.5 rounded-xl text-[11px] border transition-all ${optClass}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation box on submit */}
                      {quizSubmitted && (
                        <div className={`p-3 rounded-xl text-[10px] leading-relaxed mt-2 ${
                          isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                        }`}>
                          <strong className="block font-bold">{isCorrect ? "Correct!" : "Incorrect"}</strong>
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(quizAnswers).length < selectedTopic.quiz.length}
                  className="w-full bg-emerald-700 disabled:opacity-40 text-white font-extrabold py-3 rounded-xl hover:bg-emerald-800 transition-all text-xs flex items-center justify-center space-x-1 shadow-sm"
                >
                  <Trophy className="h-4 w-4" />
                  <span>Submit Practice Exercise Answers</span>
                </button>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center space-y-2">
                  <div className="flex justify-center">
                    <Trophy className="h-8 w-8 text-yellow-500 animate-bounce" />
                  </div>
                  <h5 className="font-extrabold text-emerald-800 text-xs">
                    Completed! Score: {quizScore} / {selectedTopic.quiz.length}
                  </h5>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {quizScore === selectedTopic.quiz.length 
                      ? "Perfect work! You have shown absolute mastery of this course syllabus chapter." 
                      : "Good attempt! Review the study notes explanations above and try again to attain 100%."}
                  </p>
                  <button
                    onClick={() => {
                      setQuizAnswers({});
                      setQuizSubmitted(false);
                      setQuizScore(0);
                    }}
                    className="mt-2 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition-all"
                  >
                    Reset & Retake Practice Quiz
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
