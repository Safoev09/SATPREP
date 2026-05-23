-- ============================================================
-- DIAGNOSTIC QUESTION SEED
-- 24 original SAT-style questions written for SATPrep.
-- These are ORIGINAL questions (not copied from College Board).
-- Review them for accuracy before relying on them with students.
--
-- HOW TO RUN:
-- Supabase -> SQL Editor -> New query -> paste this whole file -> Run
--
-- These are tagged source_test = 'Diagnostic' so the diagnostic
-- engine can find them. They are published and ready to use.
-- ============================================================

-- Clean any previous diagnostic seed (safe to re-run this file)
DELETE FROM public.questions WHERE source_test = 'Diagnostic';
DELETE FROM public.passages WHERE source = 'Diagnostic';

-- ---- Passages for R&W diagnostic questions ----
INSERT INTO public.passages (id, title, content, source) VALUES
(900001, 'Bee navigation',
'Honeybees returning to the hive perform a looping "waggle dance" that communicates the direction and distance of a food source. Researchers once assumed the dance was largely instinctive and fixed, but recent observations suggest that young bees refine the dance''s accuracy by observing experienced foragers before performing it themselves.',
'Diagnostic'),
(900002, 'Urban gardens',
'City planners in several large metropolitan areas have begun converting unused lots into community gardens. Supporters argue that these gardens cool surrounding streets, supply fresh produce, and give residents a shared space. Critics counter that the gardens occupy land that could ease housing shortages.',
'Diagnostic'),
(900003, 'Painter Mariana Ortiz',
'The painter Mariana Ortiz is known for her large canvases of desert landscapes. Although her early work used muted browns and grays, the paintings she produced after 2015 ______ far brighter, incorporating vivid oranges and deep blues that she said reflected the changing light of late afternoon.',
'Diagnostic');

-- ============================================================
-- READING & WRITING DIAGNOSTIC QUESTIONS (12)
-- ============================================================

INSERT INTO public.questions
(source_test, source_module, source_question_number, section, skill, difficulty,
 passage_id, prompt, prompt_latex, prompt_image_url,
 choice_a, choice_b, choice_c, choice_d, spr_answer, correct_answer,
 explanation, is_published)
VALUES

-- 1. Central ideas
('Diagnostic', 'Diagnostic R&W', 1, 'reading_writing', 'central_ideas', 'easy',
 900001, 'Which choice best states the main idea of the text?', NULL, NULL,
 'Honeybees cannot communicate the location of food to other bees.',
 'The waggle dance may be partly learned rather than purely instinctive.',
 'Young bees are unable to locate food sources on their own.',
 'Experienced foragers perform the waggle dance more often than young bees.',
 NULL, 'B',
 'Choice B is correct. The text says researchers once assumed the dance was instinctive and fixed, but new observations suggest young bees refine it by watching experienced foragers — meaning the dance may be partly learned. Choice A contradicts the text, which describes the dance as communication. Choice C overstates: the text never says young bees cannot find food alone. Choice D introduces a comparison of frequency that the text does not make.',
 true),

-- 2. Inferences
('Diagnostic', 'Diagnostic R&W', 2, 'reading_writing', 'inferences', 'medium',
 900002, 'Based on the text, it can reasonably be inferred that the debate over community gardens involves which tension?', NULL, NULL,
 'A tension between residents who want gardens and residents who want parks.',
 'A tension between the benefits of green space and the need for housing.',
 'A tension between city planners and produce suppliers.',
 'A tension between cooling streets and growing fresh produce.',
 NULL, 'B',
 'Choice B is correct. Supporters value the gardens'' benefits (cooling, produce, shared space), while critics note the land could ease housing shortages — a tension between green space and housing. Choice A is not supported; parks are never mentioned. Choice C misidentifies the parties in conflict. Choice D pairs two benefits that the text presents as compatible, not opposed.',
 true),

-- 3. Words in context
('Diagnostic', 'Diagnostic R&W', 3, 'reading_writing', 'words_in_context', 'medium',
 NULL, 'Which choice completes the text with the most logical and precise word or phrase? "The committee''s report was praised for its ______ analysis: every claim was supported by evidence and no detail was overlooked."', NULL, NULL,
 'hasty', 'thorough', 'reluctant', 'ambiguous',
 NULL, 'B',
 'Choice B is correct. The clues "every claim was supported by evidence" and "no detail was overlooked" describe analysis that is complete and careful — that is, thorough. Choice A (hasty) means rushed, the opposite. Choice C (reluctant) means unwilling, which does not fit. Choice D (ambiguous) means unclear, contradicting the praise.',
 true),

-- 4. Text structure
('Diagnostic', 'Diagnostic R&W', 4, 'reading_writing', 'text_structure', 'medium',
 900003, 'Which choice completes the text with the most logical and precise word or phrase?', NULL, NULL,
 'turned', 'remained', 'seemed', 'continued',
 NULL, 'A',
 'Choice A is correct. The sentence contrasts Ortiz''s early muted work with later paintings that were "far brighter" — a change. "Turned far brighter" expresses that shift. Choice B (remained) and Choice D (continued) both imply no change, contradicting the contrast. Choice C (seemed) weakens the statement into mere appearance, which the rest of the sentence does not support.',
 true),

-- 5. Transitions
('Diagnostic', 'Diagnostic R&W', 5, 'reading_writing', 'transitions', 'medium',
 NULL, 'Which choice completes the text with the most logical transition? "Solar panel costs have fallen sharply over the past decade. ______, many households that once considered solar unaffordable are now installing it."', NULL, NULL,
 'However,', 'As a result,', 'For example,', 'In contrast,',
 NULL, 'B',
 'Choice B is correct. Falling costs are the cause; households now installing solar is the effect. "As a result" signals cause and effect. Choice A (However) and Choice D (In contrast) signal opposition, but the two sentences agree. Choice C (For example) signals an illustration, but the second sentence is a consequence, not an example.',
 true),

-- 6. Transitions (harder)
('Diagnostic', 'Diagnostic R&W', 6, 'reading_writing', 'transitions', 'hard',
 NULL, 'Which choice completes the text with the most logical transition? "The survey found that most residents supported the new bike lanes. The city council, ______, postponed the project, citing concerns about construction costs."', NULL, NULL,
 'therefore,', 'nevertheless,', 'similarly,', 'in addition,',
 NULL, 'B',
 'Choice B is correct. Residents supported the lanes, yet the council postponed the project — an unexpected contrast. "Nevertheless" signals that contrast. Choice A (therefore) signals a result that follows logically, but postponing despite support does not follow. Choice C (similarly) and Choice D (in addition) signal agreement or addition, which do not fit the opposition.',
 true),

-- 7. Boundaries
('Diagnostic', 'Diagnostic R&W', 7, 'reading_writing', 'boundaries', 'easy',
 NULL, 'Which choice completes the text so that it conforms to the conventions of Standard English? "The library extended its hours during exam week ______ students appreciated the change."', NULL, NULL,
 'week, and', 'week and', 'week. And', 'week, students',
 NULL, 'A',
 'Choice A is correct. Two independent clauses ("The library extended its hours..." and "students appreciated the change") must be joined by a comma plus a coordinating conjunction. "week, and" does this correctly. Choice B omits the comma. Choice C creates a sentence fragment beginning with "And." Choice D creates a comma splice, joining two independent clauses with only a comma.',
 true),

-- 8. Boundaries (harder)
('Diagnostic', 'Diagnostic R&W', 8, 'reading_writing', 'boundaries', 'hard',
 NULL, 'Which choice completes the text so that it conforms to the conventions of Standard English? "The museum''s newest exhibit features artifacts from three ancient cities ______ each one offers a glimpse into daily life thousands of years ago."', NULL, NULL,
 'cities,', 'cities;', 'cities', 'cities and',
 NULL, 'B',
 'Choice B is correct. "The museum''s newest exhibit features artifacts from three ancient cities" and "each one offers a glimpse into daily life" are both independent clauses. A semicolon correctly joins two related independent clauses. Choice A creates a comma splice. Choice C runs the two clauses together with no punctuation. Choice D needs a comma before "and" to join independent clauses, so "and" alone is incorrect here.',
 true),

-- 9. Form, structure, sense
('Diagnostic', 'Diagnostic R&W', 9, 'reading_writing', 'form_structure_sense', 'medium',
 NULL, 'Which choice completes the text so that it conforms to the conventions of Standard English? "Each of the volunteers ______ assigned a specific task before the event began."', NULL, NULL,
 'were', 'have been', 'was', 'are',
 NULL, 'C',
 'Choice C is correct. The subject is "Each," which is singular, so it takes a singular verb. "Each ... was assigned" agrees in number. Choices A (were), B (have been), and D (are) are all plural verb forms and do not agree with the singular subject "Each."',
 true),

-- 10. Command of evidence
('Diagnostic', 'Diagnostic R&W', 10, 'reading_writing', 'command_of_evidence', 'medium',
 900001, 'A student claims that the waggle dance is not entirely fixed at birth. Which finding, if true, would most directly support this claim?', NULL, NULL,
 'Bees raised in isolation, with no chance to observe other bees, perform less accurate dances.',
 'Bees perform the waggle dance more often in spring than in winter.',
 'Older bees travel farther from the hive than younger bees do.',
 'The waggle dance is performed inside the hive rather than outdoors.',
 NULL, 'A',
 'Choice A is correct. If isolated bees that never observe others dance less accurately, that shows experience and observation improve the dance — so it is not entirely fixed at birth. Choice B concerns frequency by season, not whether the dance is learned. Choice C concerns travel distance, not the dance''s accuracy. Choice D concerns where the dance happens, not whether it is learned.',
 true),

-- 11. Rhetorical synthesis
('Diagnostic', 'Diagnostic R&W', 11, 'reading_writing', 'rhetorical_synthesis', 'hard',
 NULL, 'While researching a topic, a student has taken these notes:
- The Aldabra giant tortoise lives on the Aldabra Atoll.
- It can weigh over 250 kilograms.
- The Galapagos giant tortoise lives on the Galapagos Islands.
- It can also weigh over 250 kilograms.
The student wants to emphasize a similarity between the two tortoises. Which choice most effectively uses the notes to accomplish this goal?', NULL, NULL,
 'The Aldabra giant tortoise lives on the Aldabra Atoll, while the Galapagos giant tortoise lives on the Galapagos Islands.',
 'Both the Aldabra giant tortoise and the Galapagos giant tortoise can weigh over 250 kilograms.',
 'The Aldabra giant tortoise can weigh over 250 kilograms.',
 'The Galapagos giant tortoise lives on the Galapagos Islands and can weigh over 250 kilograms.',
 NULL, 'B',
 'Choice B is correct. The goal is to emphasize a similarity. Both tortoises can weigh over 250 kilograms, and Choice B states this shared trait directly using "Both." Choice A emphasizes a difference in location. Choice C describes only one tortoise. Choice D describes only one tortoise, so neither shows a similarity.',
 true),

-- 12. Cross-text connections
('Diagnostic', 'Diagnostic R&W', 12, 'reading_writing', 'cross_text', 'hard',
 NULL, 'Text 1 argues that remote work increases employee productivity because workers face fewer office distractions. Text 2 argues that remote work can lower productivity because workers miss the quick, informal exchanges that happen in an office. Based on the texts, how would the author of Text 2 most likely respond to the claim in Text 1?', NULL, NULL,
 'By agreeing that office distractions are the main obstacle to productivity.',
 'By arguing that fewer distractions cannot make up for the loss of informal collaboration.',
 'By claiming that productivity cannot be measured in either setting.',
 'By suggesting that remote work has no effect on productivity at all.',
 NULL, 'B',
 'Choice B is correct. Text 2 holds that remote work can lower productivity by removing informal exchanges. Its author would push back on Text 1 by arguing the benefit of fewer distractions is outweighed by the lost collaboration. Choice A has the Text 2 author agreeing with Text 1, contradicting Text 2. Choice C raises a measurement issue neither text makes. Choice D states no effect, but Text 2 clearly claims a negative effect.',
 true),

-- ============================================================
-- MATH DIAGNOSTIC QUESTIONS (12)
-- ============================================================

-- 13. Linear equations one variable
('Diagnostic', 'Diagnostic Math', 13, 'math', 'linear_equations_one', 'easy',
 NULL, 'If 3x + 7 = 22, what is the value of x?', NULL, NULL,
 NULL, NULL, NULL, NULL, '5', '5',
 'Subtract 7 from both sides: 3x = 15. Divide both sides by 3: x = 5.',
 true),

-- 14. Linear equations two variables
('Diagnostic', 'Diagnostic Math', 14, 'math', 'linear_equations_two', 'medium',
 NULL, 'A line in the xy-plane passes through the points (0, 4) and (2, 10). What is the slope of the line?', NULL, NULL,
 '2', '3', '4', '6',
 NULL, 'B',
 'Slope is the change in y divided by the change in x. From (0, 4) to (2, 10): the change in y is 10 - 4 = 6, and the change in x is 2 - 0 = 2. Slope = 6 / 2 = 3. The answer is Choice B.',
 true),

-- 15. Linear functions
('Diagnostic', 'Diagnostic Math', 15, 'math', 'linear_functions', 'medium',
 NULL, 'The function f is defined by f(x) = 5x - 8. What is the value of f(4)?', NULL, NULL,
 '12', '20', '28', '32',
 NULL, 'A',
 'Substitute x = 4 into f(x) = 5x - 8: f(4) = 5(4) - 8 = 20 - 8 = 12. The answer is Choice A.',
 true),

-- 16. Systems of linear equations
('Diagnostic', 'Diagnostic Math', 16, 'math', 'systems_linear', 'hard',
 NULL, 'If x + y = 10 and x - y = 4, what is the value of x?', NULL, NULL,
 NULL, NULL, NULL, NULL, '7', '7',
 'Add the two equations: (x + y) + (x - y) = 10 + 4, which gives 2x = 14, so x = 7.',
 true),

-- 17. Linear inequalities
('Diagnostic', 'Diagnostic Math', 17, 'math', 'linear_inequalities', 'medium',
 NULL, 'Which value of x satisfies the inequality 2x - 3 > 9?', NULL, NULL,
 '5', '6', '7', '4',
 NULL, 'C',
 'Add 3 to both sides: 2x > 12. Divide by 2: x > 6. Of the choices, only 7 is greater than 6, so the answer is Choice C. (Note: 6 itself does not satisfy x > 6.)',
 true),

-- 18. Equivalent expressions
('Diagnostic', 'Diagnostic Math', 18, 'math', 'equivalent_expressions', 'medium',
 NULL, 'Which expression is equivalent to the expression below?', '(x + 3)(x + 5)', NULL,
 'x^2 + 8x + 15', 'x^2 + 15x + 8', 'x^2 + 8x + 8', 'x^2 + 2x + 15',
 NULL, 'A',
 'Use FOIL to expand (x + 3)(x + 5): First x times x = x squared. Outer x times 5 = 5x. Inner 3 times x = 3x. Last 3 times 5 = 15. Combine: x squared + 5x + 3x + 15 = x squared + 8x + 15. The answer is Choice A.',
 true),

-- 19. Nonlinear equations
('Diagnostic', 'Diagnostic Math', 19, 'math', 'nonlinear_equations', 'hard',
 NULL, 'What is one solution to the equation below?', 'x^2 - 7x + 12 = 0', NULL,
 NULL, NULL, NULL, NULL, '3', '3',
 'Factor the quadratic: x squared - 7x + 12 = (x - 3)(x - 4) = 0. So x = 3 or x = 4. Either value is a correct solution; 3 is one of them. (4 would also be accepted.)',
 true),

-- 20. Nonlinear functions
('Diagnostic', 'Diagnostic Math', 20, 'math', 'nonlinear_functions', 'hard',
 NULL, 'The function g is defined by g(x) = x^2 + 2x. What is the value of g(3)?', 'g(x) = x^2 + 2x', NULL,
 '9', '11', '15', '12',
 NULL, 'C',
 'Substitute x = 3 into g(x) = x squared + 2x: g(3) = 3 squared + 2 times 3 = 9 + 6 = 15. The answer is Choice C.',
 true),

-- 21. Ratios, rates, proportions
('Diagnostic', 'Diagnostic Math', 21, 'math', 'ratios_rates_proportions', 'easy',
 NULL, 'A recipe uses 2 cups of flour for every 3 cups of sugar. If a baker uses 8 cups of flour, how many cups of sugar are needed to keep the same ratio?', NULL, NULL,
 '10', '12', '9', '6',
 NULL, 'B',
 'The ratio of flour to sugar is 2 to 3. With 8 cups of flour, flour is multiplied by 4 (since 8 divided by 2 = 4). Multiply sugar by the same factor: 3 times 4 = 12 cups of sugar. The answer is Choice B.',
 true),

-- 22. Percentages
('Diagnostic', 'Diagnostic Math', 22, 'math', 'percentages', 'medium',
 NULL, 'A jacket originally priced at $80 is on sale for 25% off. What is the sale price of the jacket, in dollars?', NULL, NULL,
 NULL, NULL, NULL, NULL, '60', '60',
 '25% of $80 is 0.25 times 80 = $20. Subtract the discount from the original price: 80 - 20 = $60.',
 true),

-- 23. One-variable data / statistics
('Diagnostic', 'Diagnostic Math', 23, 'math', 'one_variable_data', 'medium',
 NULL, 'The list below shows the number of books five students read last month: 3, 5, 5, 7, 10. What is the median of the data?', NULL, NULL,
 '5', '6', '7', '10',
 NULL, 'A',
 'The median is the middle value when the data is ordered from least to greatest. The ordered list is 3, 5, 5, 7, 10. With five values, the middle one is the third value, which is 5. The answer is Choice A.',
 true),

-- 24. Geometry: lines, angles, triangles
('Diagnostic', 'Diagnostic Math', 24, 'math', 'lines_angles_triangles', 'medium',
 NULL, 'In a triangle, two of the angles measure 40 degrees and 75 degrees. What is the measure, in degrees, of the third angle?', NULL, NULL,
 NULL, NULL, NULL, NULL, '65', '65',
 'The angle measures of a triangle sum to 180 degrees. Add the two known angles: 40 + 75 = 115. Subtract from 180: 180 - 115 = 65 degrees.',
 true);

-- ============================================================
-- DONE. 24 diagnostic questions added. ✅
-- ============================================================
