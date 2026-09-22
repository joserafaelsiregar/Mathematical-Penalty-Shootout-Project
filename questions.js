// Junior High School Mathematics Question Bank & Procedural Generator
// Target Audience: Middle School / Junior High (Grades 7, 8, and 9)

class MathQuestionEngine {
    constructor() {
        this.zoneNames = [
            "Top-Left (Upper 90)",
            "Top-Center (High)",
            "Top-Right (Upper 90)",
            "Bottom-Left (Low Corner)",
            "Bottom-Center (Low)",
            "Bottom-Right (Low Corner)"
        ];
    }

    // Helper: random integer between min and max (inclusive)
    randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Helper: shuffle array
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Helper: generate 5 unique distractors given a correct numeric/string answer
    generateDistractors(correctVal, type = 'number', deltaRange = 8) {
        const distractors = new Set();
        const numVal = typeof correctVal === 'number' ? correctVal : parseFloat(correctVal);

        if (!isNaN(numVal) && type === 'number') {
            const isInteger = Number.isInteger(numVal);
            let attempts = 0;
            while (distractors.size < 5 && attempts < 50) {
                attempts++;
                let offset = this.randInt(-deltaRange, deltaRange);
                if (offset === 0) offset = this.randInt(1, 3) * (Math.random() > 0.5 ? 1 : -1);
                
                // Common student traps
                let candidate;
                const trapType = this.randInt(1, 5);
                if (trapType === 1) candidate = -numVal; // Sign error
                else if (trapType === 2 && numVal !== 0) candidate = numVal * 2; // Forgot to divide / multiplied instead
                else if (trapType === 3 && numVal % 2 === 0) candidate = Math.floor(numVal / 2);
                else candidate = numVal + offset;

                if (candidate !== numVal && !distractors.has(candidate)) {
                    if (isInteger && Number.isInteger(candidate)) {
                        distractors.add(candidate);
                    } else if (!isInteger) {
                        distractors.add(parseFloat(candidate.toFixed(1)));
                    }
                }
            }

            // Fill remaining if needed
            let fallbackOffset = 1;
            while (distractors.size < 5) {
                const cand = isInteger ? numVal + fallbackOffset : parseFloat((numVal + fallbackOffset * 0.5).toFixed(1));
                if (cand !== numVal && !distractors.has(cand)) {
                    distractors.add(cand);
                }
                fallbackOffset = fallbackOffset > 0 ? -fallbackOffset : -fallbackOffset + 1;
            }

            return Array.from(distractors).map(v => isInteger ? v.toString() : v.toString());
        }

        return [];
    }

    // Question generators for Level 1: Group Stage (Grade 7 Basics)
    generateLevel1Question() {
        const templates = [
            // 1. One-step Linear Equation (Addition/Subtraction)
            () => {
                const x = this.randInt(3, 25);
                const b = this.randInt(4, 20);
                const isAdd = Math.random() > 0.5;
                if (isAdd) {
                    const total = x + b;
                    return {
                        topic: "Linear Equations",
                        question: `Solve for <span class="math-var">x</span>:<br><span class="math-eq">x + ${b} = ${total}</span>`,
                        correct: `${x}`,
                        explanation: `Subtract ${b} from both sides: <br><b>x = ${total} - ${b} = ${x}</b>`,
                        distractors: [`${total + b}`, `${x + 2}`, `${x - 2}`, `${total}`, `${Math.abs(x - b)}`]
                    };
                } else {
                    const total = x - b > 0 ? x - b : x + 5;
                    const realX = total + b;
                    return {
                        topic: "Linear Equations",
                        question: `Solve for <span class="math-var">x</span>:<br><span class="math-eq">x - ${b} = ${total}</span>`,
                        correct: `${realX}`,
                        explanation: `Add ${b} to both sides: <br><b>x = ${total} + ${b} = ${realX}</b>`,
                        distractors: [`${Math.abs(total - b)}`, `${realX + 3}`, `${realX - 3}`, `${total * 2}`, `${b}`]
                    };
                }
            },
            // 2. One-step Linear Equation (Multiplication)
            () => {
                const x = this.randInt(3, 12);
                const a = this.randInt(2, 9);
                const product = a * x;
                return {
                    topic: "Linear Equations",
                    question: `Solve for <span class="math-var">x</span>:<br><span class="math-eq">${a}x = ${product}</span>`,
                    correct: `${x}`,
                    explanation: `Divide both sides by ${a}: <br><b>x = ${product} ÷ ${a} = ${x}</b>`,
                    distractors: [`${product - a}`, `${product + a}`, `${x + 1}`, `${x - 1}`, `${a * 2}`]
                };
            },
            // 3. Percentage of a Number
            () => {
                const percents = [10, 20, 25, 50, 75];
                const p = percents[this.randInt(0, percents.length - 1)];
                const baseOptions = [40, 60, 80, 100, 120, 160, 200];
                const base = baseOptions[this.randInt(0, baseOptions.length - 1)];
                const ans = (p / 100) * base;
                return {
                    topic: "Percentages",
                    question: `Calculate: <br><span class="math-eq">${p}% of ${base}</span>`,
                    correct: `${ans}`,
                    explanation: `${p}% = ${p/100}. <br><b>${p/100} × ${base} = ${ans}</b>`,
                    distractors: [`${ans + 5}`, `${ans - 5}`, `${base - p}`, `${Math.round(ans * 1.5)}`, `${Math.round(ans / 2)}`]
                };
            },
            // 4. Complementary & Supplementary Angles
            () => {
                const isComp = Math.random() > 0.5;
                if (isComp) {
                    const angle = this.randInt(15, 75);
                    const ans = 90 - angle;
                    return {
                        topic: "Geometry: Angles",
                        question: `Two angles are <b>complementary</b> (sum to 90°). If one angle is <b>${angle}°</b>, what is the other?`,
                        correct: `${ans}°`,
                        explanation: `Complementary angles add to 90°: <br><b>90° - ${angle}° = ${ans}°</b>`,
                        distractors: [`${180 - angle}°`, `${ans + 10}°`, `${ans - 10}°`, `${90 + angle}°`, `${angle}°`]
                    };
                } else {
                    const angle = this.randInt(30, 150);
                    const ans = 180 - angle;
                    return {
                        topic: "Geometry: Angles",
                        question: `Two angles are <b>supplementary</b> (sum to 180°). If one angle is <b>${angle}°</b>, what is the other?`,
                        correct: `${ans}°`,
                        explanation: `Supplementary angles add to 180°: <br><b>180° - ${angle}° = ${ans}°</b>`,
                        distractors: [`${90 - (angle % 90)}°`, `${ans + 15}°`, `${ans - 15}°`, `${angle}°`, `${180 + angle}°`]
                    };
                }
            },
            // 5. Integer Operations with Negatives
            () => {
                const a = this.randInt(-9, -2);
                const b = this.randInt(2, 8);
                const c = this.randInt(-5, 5);
                const ans = a * b + c;
                const signC = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
                return {
                    topic: "Integers & Arithmetic",
                    question: `Evaluate the expression:<br><span class="math-eq">(${a}) × ${b} ${signC}</span>`,
                    correct: `${ans}`,
                    explanation: `Multiply first: (${a}) × ${b} = ${a * b}. <br>Then ${signC}: <b>${a * b} ${signC} = ${ans}</b>`,
                    distractors: [`${Math.abs(ans)}`, `${-(a * b) + c}`, `${ans + 2}`, `${ans - 2}`, `${a * (b + c)}`]
                };
            }
        ];

        return templates[this.randInt(0, templates.length - 1)]();
    }

    // Question generators for Level 2: Round of 16 (Grade 7/8 Core)
    generateLevel2Question() {
        const templates = [
            // 1. Two-Step Linear Equation: ax + b = c
            () => {
                const a = this.randInt(2, 6);
                const x = this.randInt(2, 10);
                const b = this.randInt(3, 15);
                const isPlus = Math.random() > 0.5;
                const c = isPlus ? a * x + b : a * x - b;
                const sign = isPlus ? '+' : '-';
                return {
                    topic: "Two-Step Equations",
                    question: `Solve for <span class="math-var">x</span>:<br><span class="math-eq">${a}x ${sign} ${b} = ${c}</span>`,
                    correct: `${x}`,
                    explanation: `Step 1: ${isPlus ? 'Subtract' : 'Add'} ${b} -> ${a}x = ${a * x}<br>Step 2: Divide by ${a} -> <b>x = ${x}</b>`,
                    distractors: [`${x + 2}`, `${x - 1}`, `${Math.round(c / a)}`, `${x * 2}`, `${Math.abs(x - 3)}`]
                };
            },
            // 2. Equation with Brackets: a(x + b) = c
            () => {
                const a = this.randInt(2, 5);
                const x = this.randInt(2, 8);
                const b = this.randInt(1, 6);
                const c = a * (x + b);
                return {
                    topic: "Equations with Parentheses",
                    question: `Solve for <span class="math-var">x</span>:<br><span class="math-eq">${a}(x + ${b}) = ${c}</span>`,
                    correct: `${x}`,
                    explanation: `Divide by ${a}: x + ${b} = ${c / a}.<br>Subtract ${b}: <b>x = ${c / a} - ${b} = ${x}</b>`,
                    distractors: [`${c / a}`, `${x + b}`, `${x + 3}`, `${x - 2}`, `${(c - b) / a}`]
                };
            },
            // 3. Exponents & Square Roots
            () => {
                const sqRoots = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];
                const num1 = sqRoots[this.randInt(0, sqRoots.length - 1)];
                const base2 = this.randInt(2, 5);
                const exp2 = this.randInt(2, 3);
                const val1 = Math.round(Math.sqrt(num1));
                const val2 = Math.pow(base2, exp2);
                const isAdd = Math.random() > 0.5;
                const ans = isAdd ? val1 + val2 : val1 - val2;
                const sign = isAdd ? '+' : '-';
                return {
                    topic: "Powers & Roots",
                    question: `Calculate the value of:<br><span class="math-eq">√${num1} ${sign} ${base2}<sup>${exp2}</sup></span>`,
                    correct: `${ans}`,
                    explanation: `√${num1} = ${val1}, and ${base2}<sup>${exp2}</sup> = ${val2}.<br><b>${val1} ${sign} ${val2} = ${ans}</b>`,
                    distractors: [`${val1 + val2 + 4}`, `${val1 * val2}`, `${ans + 3}`, `${ans - 3}`, `${num1 + val2}`]
                };
            },
            // 4. Triangle Interior Angles
            () => {
                const a1 = this.randInt(30, 80);
                const a2 = this.randInt(35, 75);
                const a3 = 180 - (a1 + a2);
                return {
                    topic: "Geometry: Triangles",
                    question: `A triangle has two angles measuring <b>${a1}°</b> and <b>${a2}°</b>. What is the measure of the third angle?`,
                    correct: `${a3}°`,
                    explanation: `The sum of angles in a triangle is 180°:<br><b>180° - (${a1}° + ${a2}°) = ${a3}°</b>`,
                    distractors: [`${a1 + a2}°`, `${90 - (a1 % 45)}°`, `${a3 + 10}°`, `${a3 - 10}°`, `${180 - a1}°`]
                };
            },
            // 5. Ratios and Proportions
            () => {
                const r1 = this.randInt(2, 5);
                const r2 = this.randInt(3, 7);
                const multiplier = this.randInt(2, 6);
                const given = r1 * multiplier;
                const ans = r2 * multiplier;
                return {
                    topic: "Ratios & Proportions",
                    question: `Find <span class="math-var">n</span> in the proportion:<br><span class="math-eq">${r1} : ${r2} = ${given} : n</span>`,
                    correct: `${ans}`,
                    explanation: `Scale factor = ${given} ÷ ${r1} = ${multiplier}.<br><b>n = ${r2} × ${multiplier} = ${ans}</b>`,
                    distractors: [`${ans + r1}`, `${ans - r2}`, `${given + r2}`, `${r1 * r2}`, `${ans * 2}`]
                };
            }
        ];

        return templates[this.randInt(0, templates.length - 1)]();
    }

    // Question generators for Level 3: Quarter-Final (Grade 8 Intermediate)
    generateLevel3Question() {
        const templates = [
            // 1. Equations with Variables on Both Sides
            () => {
                const x = this.randInt(2, 9);
                const a = this.randInt(4, 7);
                const b = this.randInt(2, a - 1); // b < a
                const k1 = this.randInt(2, 10);
                const k2 = (a - b) * x + k1;
                // ax + k1 = bx + k2
                return {
                    topic: "Multi-Step Equations",
                    question: `Solve for <span class="math-var">x</span>:<br><span class="math-eq">${a}x + ${k1} = ${b}x + ${k2}</span>`,
                    correct: `${x}`,
                    explanation: `Subtract ${b}x: (${a - b})x + ${k1} = ${k2}<br>Subtract ${k1}: ${a - b}x = ${k2 - k1}<br><b>x = ${x}</b>`,
                    distractors: [`${x + 1}`, `${x + 2}`, `${x - 1}`, `${Math.round((k2 + k1) / (a + b))}`, `${x * 2}`]
                };
            },
            // 2. Pythagorean Theorem (Hypotenuse or Leg)
            () => {
                const triples = [
                    [3, 4, 5],
                    [5, 12, 13],
                    [6, 8, 10],
                    [8, 15, 17],
                    [9, 12, 15]
                ];
                const triple = triples[this.randInt(0, triples.length - 1)];
                const findHypotenuse = Math.random() > 0.5;

                if (findHypotenuse) {
                    return {
                        topic: "Pythagorean Theorem",
                        question: `In a right triangle with legs of length <b>a = ${triple[0]}</b> and <b>b = ${triple[1]}</b>, find the hypotenuse <span class="math-var">c</span>:`,
                        correct: `${triple[2]}`,
                        explanation: `c² = a² + b² = ${triple[0]}² + ${triple[1]}² = ${triple[0]*triple[0] + triple[1]*triple[1]}<br><b>c = √${triple[2]*triple[2]} = ${triple[2]}</b>`,
                        distractors: [`${triple[0] + triple[1]}`, `${triple[2] + 2}`, `${triple[2] - 1}`, `${triple[1] + 1}`, `${triple[2] * 2}`]
                    };
                } else {
                    return {
                        topic: "Pythagorean Theorem",
                        question: `In a right triangle with hypotenuse <b>c = ${triple[2]}</b> and leg <b>a = ${triple[0]}</b>, find the other leg <span class="math-var">b</span>:`,
                        correct: `${triple[1]}`,
                        explanation: `b² = c² - a² = ${triple[2]}² - ${triple[0]}² = ${triple[2]*triple[2] - triple[0]*triple[0]} = ${triple[1]*triple[1]}<br><b>b = ${triple[1]}</b>`,
                        distractors: [`${triple[2] - triple[0]}`, `${triple[1] + 2}`, `${triple[1] - 1}`, `${triple[2] + 1}`, `${Math.round((triple[2] + triple[0]) / 2)}`]
                    };
                }
            },
            // 3. Statistics: Mean, Median, Range
            () => {
                const base = this.randInt(10, 20);
                const nums = [base, base + 2, base + 4, base + 6, base + 8]; // 5 numbers
                const sum = nums.reduce((a, b) => a + b, 0);
                const mean = sum / 5;
                const median = nums[2];
                const range = nums[4] - nums[0];
                const modeType = this.randInt(1, 2);

                if (modeType === 1) {
                    return {
                        topic: "Statistics: Mean",
                        question: `Calculate the <b>mean (average)</b> of the data set:<br><span class="math-eq">{${nums.join(', ')}}</span>`,
                        correct: `${mean}`,
                        explanation: `Sum = ${sum}. Total items = 5.<br><b>Mean = ${sum} ÷ 5 = ${mean}</b>`,
                        distractors: [`${mean + 2}`, `${mean - 2}`, `${sum}`, `${median - 1}`, `${range}`]
                    };
                } else {
                    const shuffled = this.shuffle([...nums]);
                    return {
                        topic: "Statistics: Median",
                        question: `Find the <b>median</b> of the data set:<br><span class="math-eq">{${shuffled.join(', ')}}</span>`,
                        correct: `${median}`,
                        explanation: `Order the values from least to greatest: {${nums.join(', ')}}.<br>The middle number is <b>${median}</b>.`,
                        distractors: [`${mean}`, `${range}`, `${nums[0]}`, `${nums[4]}`, `${median + 2}`]
                    };
                }
            },
            // 4. Area of Triangle or Trapezoid
            () => {
                const b = this.randInt(4, 12) * 2; // ensure even
                const h = this.randInt(3, 9);
                const area = 0.5 * b * h;
                return {
                    topic: "Geometry: Area",
                    question: `Find the <b>area</b> of a triangle with base <b>b = ${b} cm</b> and height <b>h = ${h} cm</b>:`,
                    correct: `${area} cm²`,
                    explanation: `Area = ½ × base × height = ½ × ${b} × ${h} = <b>${area} cm²</b>`,
                    distractors: [`${b * h} cm²`, `${area + b} cm²`, `${area - h} cm²`, `${(b + h) * 2} cm²`, `${area * 2} cm²`]
                };
            }
        ];

        return templates[this.randInt(0, templates.length - 1)]();
    }

    // Question generators for Level 4: Semi-Final (Grade 8/9 Advanced)
    generateLevel4Question() {
        const templates = [
            // 1. Simple Quadratic Difference of Squares: x² - a² = 0 (positive root)
            () => {
                const root = this.randInt(3, 12);
                const sq = root * root;
                return {
                    topic: "Quadratic Equations",
                    question: `Find the positive solution for <span class="math-var">x</span>:<br><span class="math-eq">x² - ${sq} = 0</span>`,
                    correct: `${root}`,
                    explanation: `x² = ${sq} -> x = ±√${sq} = ±${root}.<br>The positive solution is <b>x = ${root}</b>.`,
                    distractors: [`${sq / 2}`, `${root * 2}`, `${root + 3}`, `${root - 1}`, `${sq}`]
                };
            },
            // 2. Factored Quadratic Roots: (x - a)(x - b) = 0
            () => {
                const a = this.randInt(2, 6);
                const b = this.randInt(7, 11);
                return {
                    topic: "Quadratic Factoring",
                    question: `What are the solutions to the equation:<br><span class="math-eq">(x - ${a})(x - ${b}) = 0</span>?`,
                    correct: `x = ${a} or ${b}`,
                    explanation: `Set each factor to zero: x - ${a} = 0 => x = ${a}; x - ${b} = 0 => x = ${b}.<br><b>x = ${a} or ${b}</b>`,
                    distractors: [
                        `x = -${a} or -${b}`,
                        `x = ${a} or -${b}`,
                        `x = -${a} or ${b}`,
                        `x = ${a + b} only`,
                        `x = ${a * b} only`
                    ]
                };
            },
            // 3. Slope of a Line through 2 points: m = (y2 - y1) / (x2 - x1)
            () => {
                const x1 = this.randInt(1, 4);
                const y1 = this.randInt(2, 6);
                const m = this.randInt(2, 5); // integer slope
                const dx = this.randInt(1, 3);
                const x2 = x1 + dx;
                const y2 = y1 + m * dx;
                return {
                    topic: "Coordinate Geometry",
                    question: `Find the <b>slope (m)</b> of the line passing through points <b>(${x1}, ${y1})</b> and <b>(${x2}, ${y2})</b>:`,
                    correct: `${m}`,
                    explanation: `Slope m = (y₂ - y₁) / (x₂ - x₁) = (${y2} - ${y1}) / (${x2} - ${x1}) = ${y2 - y1} / ${dx} = <b>${m}</b>`,
                    distractors: [`${-m}`, `${m + 1}`, `${m - 1}`, `${parseFloat((1/m).toFixed(2))}`, `${y2 - y1}`]
                };
            },
            // 4. System of 2 Linear Equations (Sum & Difference)
            () => {
                const x = this.randInt(5, 15);
                const y = this.randInt(2, x - 1);
                const sum = x + y;
                const diff = x - y;
                return {
                    topic: "Systems of Equations",
                    question: `Solve the system for <span class="math-var">x</span>:<br><span class="math-eq">x + y = ${sum}</span><br><span class="math-eq">x - y = ${diff}</span>`,
                    correct: `${x}`,
                    explanation: `Add both equations: 2x = ${sum} + ${diff} = ${sum + diff}.<br><b>x = ${sum + diff} ÷ 2 = ${x}</b> (and y = ${y})`,
                    distractors: [`${y}`, `${sum}`, `${diff}`, `${x + 2}`, `${Math.round(sum / 2)}`]
                };
            },
            // 5. Volume of a Cylinder: V = π r² h
            () => {
                const r = this.randInt(2, 6);
                const h = this.randInt(3, 8);
                const r2h = r * r * h;
                return {
                    topic: "Geometry: Volume",
                    question: `A cylinder has radius <b>r = ${r} cm</b> and height <b>h = ${h} cm</b>. Find its volume in terms of <span class="math-var">π</span>:`,
                    correct: `${r2h}π cm³`,
                    explanation: `Volume = π × r² × h = π × ${r}² × ${h} = π × ${r*r} × ${h} = <b>${r2h}π cm³</b>`,
                    distractors: [`${2 * r * h}π cm³`, `${r * h}π cm³`, `${(r2h + 10)}π cm³`, `${r2h * 2}π cm³`, `${r * r * h} cm³`]
                };
            }
        ];

        return templates[this.randInt(0, templates.length - 1)]();
    }

    // Question generators for Level 5: Championship Final (Grade 9 Elite / Spain vs England)
    generateLevel5Question() {
        const templates = [
            // 1. Multi-Step Algebraic Fractional Equation: (ax + b)/c = d
            () => {
                const a = this.randInt(2, 4);
                const x = this.randInt(3, 8);
                const b = this.randInt(1, 7);
                const c = this.randInt(2, 4);
                const num = a * x + b;
                const d = (num / c);
                // Ensure nice numbers
                const niceC = 2;
                const niceA = 3;
                const niceX = this.randInt(3, 7);
                const niceB = (niceX % 2 === 1) ? 5 : 4;
                const totalNum = niceA * niceX + niceB;
                const targetD = totalNum / niceC;
                return {
                    topic: "Fractional Linear Equations",
                    question: `Solve for <span class="math-var">x</span>:<br><span class="math-eq">(${niceA}x + ${niceB}) / ${niceC} = ${targetD}</span>`,
                    correct: `${niceX}`,
                    explanation: `Multiply by ${niceC}: ${niceA}x + ${niceB} = ${totalNum}<br>Subtract ${niceB}: ${niceA}x = ${niceA * niceX}<br>Divide by ${niceA}: <b>x = ${niceX}</b>`,
                    distractors: [`${niceX + 1}`, `${niceX - 1}`, `${niceX + 2}`, `${Math.round(targetD)}`, `${niceX * 2}`]
                };
            },
            // 2. Scientific Notation Multiplication
            () => {
                const a = this.randInt(2, 4);
                const expA = this.randInt(3, 5);
                const b = this.randInt(2, 3);
                const expB = this.randInt(2, 4);
                const prodCoeff = a * b;
                const prodExp = expA + expB;
                return {
                    topic: "Scientific Notation",
                    question: `Evaluate and simplify:<br><span class="math-eq">(${a} × 10<sup>${expA}</sup>) × (${b} × 10<sup>${expB}</sup>)</span>`,
                    correct: `${prodCoeff} × 10<sup>${prodExp}</sup>`,
                    explanation: `Multiply coefficients: ${a} × ${b} = ${prodCoeff}.<br>Add exponents: 10<sup>${expA} + ${expB}</sup> = 10<sup>${prodExp}</sup>.<br><b>Result = ${prodCoeff} × 10<sup>${prodExp}</sup></b>`,
                    distractors: [
                        `${prodCoeff} × 10<sup>${expA * expB}</sup>`,
                        `${a + b} × 10<sup>${prodExp}</sup>`,
                        `${prodCoeff} × 10<sup>${prodExp + 1}</sup>`,
                        `${prodCoeff} × 10<sup>${prodExp - 1}</sup>`,
                        `${prodCoeff * 10} × 10<sup>${prodExp}</sup>`
                    ]
                };
            },
            // 3. Quadratic Factorization: x² + bx + c = 0
            () => {
                const p = this.randInt(2, 5);
                const q = this.randInt(6, 9);
                const b = p + q;
                const c = p * q;
                return {
                    topic: "Quadratic Equations",
                    question: `Solve for <span class="math-var">x</span>:<br><span class="math-eq">x² - ${b}x + ${c} = 0</span>`,
                    correct: `x = ${p} or ${q}`,
                    explanation: `Factor the trinomial: (x - ${p})(x - ${q}) = 0.<br>Set factors to 0: <b>x = ${p} or ${q}</b>`,
                    distractors: [
                        `x = -${p} or -${q}`,
                        `x = ${p} or -${q}`,
                        `x = -${p} or ${q}`,
                        `x = ${b} only`,
                        `x = ${c / 2} only`
                    ]
                };
            },
            // 4. Probability of Independent Events
            () => {
                // Two coin tosses or dice roll + coin
                const outcomes = [
                    { q: "A fair 6-sided die is rolled. What is the probability of rolling a prime number (2, 3, or 5)?", ans: "1/2", exp: "Prime numbers on a die are {2, 3, 5} -> 3 favorable outcomes out of 6. <br>3/6 = <b>1/2</b>", dist: ["1/3", "1/6", "2/3", "5/6", "1/4"] },
                    { q: "A bag contains 4 red, 5 blue, and 3 green marbles. What is the probability of drawing a blue marble?", ans: "5/12", exp: "Total marbles = 4 + 5 + 3 = 12. Blue marbles = 5.<br>Probability = <b>5/12</b>", dist: ["1/3", "1/4", "7/12", "5/7", "1/2"] },
                    { q: "Two coins are flipped simultaneously. What is the probability of getting at least one Head?", ans: "3/4", exp: "Possible outcomes: {HH, HT, TH, TT} = 4 outcomes. Favorable outcomes with at least 1 head: {HH, HT, TH} = 3.<br><b>Probability = 3/4</b>", dist: ["1/2", "1/4", "2/3", "1/3", "1"] }
                ];
                const chosen = outcomes[this.randInt(0, outcomes.length - 1)];
                return {
                    topic: "Probability",
                    question: chosen.q,
                    correct: chosen.ans,
                    explanation: chosen.exp,
                    distractors: chosen.dist
                };
            },
            // 5. Exponent Laws with Division and Power of a Power
            () => {
                const p = this.randInt(2, 4);
                const q = this.randInt(3, 5);
                const r = this.randInt(2, 3);
                const topExp = p + q;
                const finalExp = topExp - r;
                return {
                    topic: "Exponent Rules",
                    question: `Simplify into a single power of <span class="math-var">x</span>:<br><span class="math-eq">(x<sup>${p}</sup> · x<sup>${q}</sup>) / x<sup>${r}</sup></span>`,
                    correct: `x<sup>${finalExp}</sup>`,
                    explanation: `Product rule: x<sup>${p}</sup> · x<sup>${q}</sup> = x<sup>${p}+${q}</sup> = x<sup>${topExp}</sup>.<br>Quotient rule: x<sup>${topExp}</sup> / x<sup>${r}</sup> = x<sup>${topExp}-${r}</sup> = <b>x<sup>${finalExp}</sup></b>`,
                    distractors: [
                        `x<sup>${topExp}</sup>`,
                        `x<sup>${(p * q) - r}</sup>`,
                        `x<sup>${finalExp + 2}</sup>`,
                        `x<sup>${finalExp - 1}</sup>`,
                        `x<sup>${p + q + r}</sup>`
                    ]
                };
            }
        ];

        return templates[this.randInt(0, templates.length - 1)]();
    }

    // Get 3 questions for a level (1 level = 3 penalty shots)
    getLevelQuestions(levelIndex) {
        const questions = [];
        for (let i = 0; i < 3; i++) {
            let qData;
            if (levelIndex === 1) qData = this.generateLevel1Question();
            else if (levelIndex === 2) qData = this.generateLevel2Question();
            else if (levelIndex === 3) qData = this.generateLevel3Question();
            else if (levelIndex === 4) qData = this.generateLevel4Question();
            else qData = this.generateLevel5Question(); // Level 5 and infinite

            // Assemble 6 options (1 correct, 5 distractors)
            let options = [qData.correct, ...qData.distractors.slice(0, 5)];
            // Ensure unique options
            options = Array.from(new Set(options));
            while (options.length < 6) {
                options.push(`${qData.correct}*`);
            }

            // Shuffle options and assign to zones (0 to 5)
            const shuffledOptions = this.shuffle(options.map(opt => ({ text: opt, isCorrect: opt === qData.correct })));
            
            const correctZone = shuffledOptions.findIndex(o => o.isCorrect);

            questions.push({
                topic: qData.topic,
                questionText: qData.question,
                explanation: qData.explanation,
                options: shuffledOptions.map(o => o.text),
                correctZoneIndex: correctZone,
                correctAnswerText: qData.correct
            });
        }
        return questions;
    }
}

// Global instance
window.mathEngine = new MathQuestionEngine();
