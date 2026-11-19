// Display-only translations. Canonical activity values and user-authored content are retained.
function translateThinkingProcessText(text, lang) {
    const english = {
        'の思考過程': ' — Thinking process',
        '自己内対話': 'Self-dialogue',
        '議論資料作成': 'Discussion Material Preparation',
        '議論内省': 'Discussion Reflection',
        '論文執筆': 'Paper Writing',
        '論文読解': 'Paper Reading',
        '思考支援': 'Thinking Support',
        '会議内省': 'Meeting Reflection',
        '会議': 'Meeting',
        '資料作成': 'Document Creation',
        '資料検討': 'Document Review',
        '-何の活動を行いましたか？-': '- Select an activity -',
        '親ノード関連': 'Related to Parent Node',
        '関連する観点': 'Related Perspectives',
        '候補はありません': 'No candidates available',
        '活動日時': 'Activity date and time',
        '活動の種類': 'Activity type',
        'きっかけの内容': 'Trigger description',
        'ノードとして追加': 'Add as Node',
        'マインドマップを表示': 'Show Mind Map',
        'どの活動を行ったのか入力してください': 'Select an activity type.',
        'どのような活動を行ったのか入力してください': 'Describe what happened in the activity.',
        'triggerを追加するedgeを選択してください': 'Select an edge to add a trigger.',
        '時刻表示以外のノードを選択してください': 'Select nodes other than timestamp labels.',
        '追加したい箇所のエッジを選択してください': 'Select the edge where you want to add the trigger.'
    };
    return (lang || window.currentLang || 'ja') === 'en' && Object.prototype.hasOwnProperty.call(english, text) ? english[text] : text;
}
window.translateThinkingProcessText = translateThinkingProcessText;

// Display translations for the canonical labels in js/hozo.xml.
// IDs, XML labels and saved values remain unchanged.
const thinkingProcessOntologyEnglish = {
    "活動": "Activity",
    "メタ認知活動": "Metacognitive activity",
    "素活動_メタ認知活動": "Elementary activity / Metacognitive activity",
    "問い生成活動": "Question generation",
    "複合活動_メタ認知": "Composite activity / Metacognition",
    "認知活動": "Cognitive activity",
    "行動": "Behavior",
    "問い回答活動": "Question answering",
    "反論を考える": "Consider counterarguments",
    "目的確認活動": "Purpose checking",
    "成果物": "Artifact",
    "問い": "Question",
    "実践に落とし込めるかを考える": "Consider application to practice",
    "論文に落とし込めるかを考える": "Consider application to paper",
    "素活動_認知活動": "Elementary activity / Cognitive activity",
    "複合活動_認知活動": "Composite activity / Cognitive activity",
    "妥当性を考える": "Consider validity",
    "有用性を考える": "Consider usefulness",
    "実践のデザインを考える": "Consider practice design",
    "要約をする": "Summarize",
    "倫理に反していないかを考える": "Check ethical acceptability",
    "確認活動": "Checking activity",
    "素活動確認活動": "Elementary checking activity",
    "素活動_行動": "Elementary activity / Behavior",
    "複合活動_行動": "Composite activity / Behavior",
    "複合活動確認活動": "Composite checking activity",
    "研究に落とし込めるかを考える": "Consider application to research",
    "思考プロセス確認活動": "Thinking process review",
    "目的": "Purpose",
    "汎用性を考える": "Consider generality",
    "新規性": "Novelty",
    "アイディア": "Idea",
    "妥当性": "Validity",
    "有用性": "Usefulness",
    "汎用性": "Generality",
    "システムに落とし込めるかを考える": "Consider application to system",
    "システムのデザインを考える": "Consider system design",
    "優先順位を考える": "Consider priorities",
    "条件": "Condition",
    "制約": "Constraint",
    "時間的制約": "Time constraints",
    "技術的制約": "Technical constraints",
    "能力的制約": "Ability constraints",
    "環境的制約": "Environmental constraints",
    "自分の興味を考える": "Consider personal interests",
    "前提条件を考える": "Consider prerequisites",
    "取り組む意義がある問題かを考える": "Consider whether the problem is worth addressing",
    "前回のMT内容を振り返る": "Review the previous meeting",
    "自分のスキルを見定める": "Assess personal skills",
    "悩んでいることは何かを考える": "Identify concerns",
    "他者を意識する": "Consider others",
    "議論参加者を意識する": "Consider discussion participants",
    "査読者を意識する": "Consider reviewers",
    "他の選択肢を考える": "Consider other options",
    "原因を考える": "Consider causes",
    "メリットを考える": "Consider advantages",
    "観点": "Perspective",
    "教師の観点": "Teacher perspective",
    "学習者の観点": "Learner perspective",
    "ユーザーの観点": "User perspective",
    "必要条件を考える": "Consider necessary conditions",
    "デメリットを考える": "Consider disadvantages",
    "議論すべき内容を考える": "Consider topics to discuss",
    "議論目的": "Discussion purpose",
    "議論内容": "Discussion content",
    "議論目的を設定する": "Set discussion purpose",
    "対象者を考える": "Consider target participants",
    "今後の課題を考える": "Consider future work",
    "評価方法を考える": "Consider evaluation methods",
    "評価方法": "Evaluation methods",
    "評価者を考える": "Consider evaluators",
    "実践の目的を考える": "Consider practice purpose",
    "実践目的": "Practice purpose",
    "実践の仮説を考える": "Consider practice hypothesis",
    "実践仮説": "Practice hypothesis",
    "実践の手順を考える": "Consider practice procedure",
    "実践の理想の結果を考える": "Consider ideal practice outcome",
    "実践の考察を考える": "Consider practice reflection",
    "実践手順": "Practice procedure",
    "理想の実践結果": "Ideal practice outcome",
    "実践結果": "Practice results",
    "実践の考察": "Practice reflection",
    "具体例を考える": "Consider examples",
    "言い換える": "Rephrase",
    "言葉の定義を考える": "Consider term definitions",
    "研究仮説を考える": "Consider research hypothesis",
    "問題を課題に分解する": "Break down a problem into tasks",
    "問題": "Problem",
    "課題": "Task",
    "事実と推測を明確にする": "Distinguish facts from speculation",
    "理由を考える": "Consider reasons",
    "目的を設定する": "Set purpose",
    "サブゴールを設定する": "Set subgoal",
    "研究目的を設定する": "Set research purpose",
    "学習目標を設定する": "Set learning objectives",
    "研究目的": "Research purpose",
    "学習目標": "Learning objectives",
    "研究分野": "Research field",
    "教育システム情報学分野": "Information and systems in education",
    "研究を進める": "Advance research",
    "問題を発見する": "Identify a problem",
    "課題を設定する": "Set task",
    "課題を解決する": "Solve a task",
    "論文に落とし込む": "Develop into a paper",
    "調査する": "Investigate",
    "文献を調査する": "Review literature",
    "取り組むべき課題": "Tasks to address",
    "解決手法を考える": "Consider solution approach",
    "システムを実装する": "Implement a system",
    "実践を行う": "Conduct practice",
    "必要条件": "Necessary conditions",
    "解決手法": "Solution approach",
    "特徴を考える": "Consider characteristics",
    "比較する": "Compare",
    "学習支援の方法を考える": "Consider learning support methods",
    "学習支援の方法": "Learning support methods",
    "関連研究との違いを考える": "Consider differences from related research",
    "関連研究": "Related research",
    "デザイン": "Design",
    "システムデザイン": "System design",
    "実践デザイン": "Practice design",
    "共通点を見つける": "Identify similarities",
    "相違点を見つける": "Identify differences",
    "研究背景を位置づける": "Position the research background",
    "学習者を想定する": "Define the target learners",
    "書く": "Write",
    "読む": "Read",
    "文献": "Literature",
    "関連研究を調査する": "Review related research",
    "先行研究を調査する": "Review prior research",
    "モジュールを構築する": "Build module",
    "教材モジュールを構築する": "Build learning material module",
    "教授戦略モジュールを構築する": "Build teaching strategy module",
    "学習者モデルモジュールを構築する": "Build learner model module",
    "インタフェースモジュールを構築する": "Build interface module",
    "知的教育システムを実装する": "Implement an intelligent educational system",
    "システム": "System",
    "研究MTを行う": "Hold a research meeting",
    "評価する": "Evaluate",
    "評価結果": "Evaluation results",
    "研究MT資料を作成する": "Prepare research meeting materials",
    "研究MT資料": "Research meeting materials",
    "論文": "Paper",
    "結果": "Results",
    "手法": "Method",
    "学習的新規性": "Novelty in learning support",
    "技術的新規性": "Technical novelty",
    "十分条件": "Sufficient conditions",
    "モジュール": "Module",
    "教材モジュール": "Learning material module",
    "学習者モデルモジュール": "Learner model module",
    "教授戦略モジュール": "Teaching strategy module",
    "実践方法": "Practice methods",
    "実践方法を考える": "Consider practice methods",
    "それは実践に落とし込めますか？": "Can this be put into practice?",
    "それは論文に落とし込めますか？": "Can this be put into a paper?",
    "それはシステムに落とし込めますか？": "Can this be implemented in a system?",
    "優先順位はどうなりますか？": "What is the priority order?",
    "これは本当に取り組む意義のある問題ですか？": "Is this truly a meaningful problem to tackle?",
    "それは研究に落とし込めますか？": "Can this be applied to research?",
    "他の選択肢は考えられますか？": "Are there other options?",
    "要約するとどうなりますか？": "How would you summarize it?",
    "これは倫理に反していませんか？": "Is this against ethics?",
    "前回のMTの内容はどのようなものでしたか？": "What was discussed in the previous MT?",
    "今の自分の能力はどれくらいですか？": "What is your current ability level?",
    "議論参加者の観点から考えられていますか？": "Is this considered from the participants’ perspective?",
    "査読者の観点から考えられていますか？": "Is this considered from the reviewers’ perspective?",
    "どのような妥当性がありますか？": "What kind of validity does it have?",
    "どのような有用性がありますか？": "What kind of usefulness does it have?",
    "どのような汎用性がありますか？": "What kind of generality does it have?",
    "原因は何ですか？": "What is the cause?",
    "必要条件は何ですか？": "What are the necessary conditions?",
    "議論すべき内容は何ですか？": "What should be discussed?",
    "議論目的は何ですか": "What is the purpose of the discussion?",
    "今後の課題は何ですか？": "What are the future issues?",
    "実践の目的は何ですか？": "What is the purpose of the practice?",
    "これは事実ですか？推測ですか？": "Is this a fact or a speculation?",
    "なぜそう考えるのですか？": "Why do you think so?",
    "具体例はどのようなものがありますか？": "What are some concrete examples?",
    "言い換えるとどのようになりますか？": "How would you rephrase it?",
    "この言葉の定義は何ですか？": "What is the definition of this term?",
    "反論としてはどのようなものが考えられますか？": "What counterarguments can be considered?",
    "前提条件は何ですか？": "What are the prerequisites?",
    "自分の興味は何ですか？": "What are your interests?",
    "悩んでいることは何ですか？": "What are you worried about?",
    "メリットは何ですか？": "What are the advantages?",
    "デメリットは何ですか？": "What are the disadvantages?",
    "学習者はどのような人を想定していますか？": "What kind of learners are assumed?",
    "評価者はどのような人を想定していますか？": "What kind of evaluators are assumed?",
    "実践仮説は何ですか？": "What is the practical hypothesis?",
    "実践の手順はどのようなものですか？": "What are the steps of the practice?",
    "実践の理想の結果は何ですか？": "What is the ideal outcome of the practice?",
    "実践の考察は何ですか？": "What are the reflections on the practice?",
    "研究仮説は何ですか？": "What is the research hypothesis?",
    "サブゴールは何ですか？": "What is the sub-goal?",
    "学習目標は何ですか？": "What is the learning objective?",
    "研究目的は何ですか？": "What is the research purpose?",
    "目的は何ですか？": "What is the purpose?",
    "システムデザインはどのようなものですか？": "What is the system design like?",
    "問題を課題に分解するとどうなりますか？": "How does the problem break down into tasks?",
    "評価方法はどのようなものですか？": "What are the evaluation methods?",
    "特徴は何ですか？": "What are the characteristics?",
    "実践のデザインはどのようなものですか？": "What is the design of the practice?",
    "研究背景はどのように位置づけられますか？": "How is the research background positioned?",
    "自分の研究はどのようなものですか？": "What is your research about?",
    "どのような問題を発見しましたか？": "What problems did you find?",
    "どのように課題を解決しますか？": "How will you solve the issues?",
    "学習支援の方法は何ですか？": "What are the learning support methods?",
    "共通点は何ですか？": "What are the common points?",
    "相違点は何ですか？": "What are the differences?",
    "実践方法はどのようなものですか？": "What are the practical methods?",
    "これは目的を達成できていますか？": "Is this achieving the objective?",
    "時間的制約を考える": "Consider time constraints",
    "時間的制約を考慮すると，その計画は現実的ですか？": "Considering time constraints, is the plan realistic?",
    "実践は行いましたか？": "Did you carry out the practice?",
    "合理性を考える": "Consider rationality",
    "なぜこれらは合理的であるといえるのですか？": "Why can these be considered rational?",
    "実践の目的を考えること，実践の仮説を考えるの合理性を考える": "Consider the rationality of consider practice purpose and consider practice hypothesis",
    "実践の目的を考える，実践の手順を考えるの合理性を考える": "Consider the rationality of consider practice purpose and consider practice procedure",
    "実践の目的を考える，実践の理想の結果を考えるの合理性を考える": "Consider the rationality of consider practice purpose and consider ideal practice outcome",
    "実践の仮説を考える，実践の手順を考えることの合理性を考える": "Consider the rationality of consider practice hypothesis and consider practice procedure",
    "実践の仮説を考える，実践の理想の結果を考えるの合理性を考える": "Consider the rationality of consider practice hypothesis and consider ideal practice outcome",
    "実践の手順を考える，実践の理想の結果を考えるの合理性を考える": "Consider the rationality of consider practice procedure and consider ideal practice outcome",
    "解決手法を考える，システムを実装するの合理性を考える": "Consider the rationality of consider solution approach and implement a system",
    "システムを実装する，実践を行うの合理性を考える": "Consider the rationality of implement a system and conduct practice",
    "問題を発見する，問題を課題に分解するの合理性を考える": "Consider the rationality of identify a problem and break down a problem into tasks",
    "問題を発見する，研究目的を設定するの合理性を考える": "Consider the rationality of identify a problem and set research purpose",
    "議論目的を設定する，議論すべき内容を考えるの合理性を考える": "Consider the rationality of set discussion purpose and consider topics to discuss",
    "問題を課題に分解する，研究目的を設定するの合理性を考える": "Consider the rationality of break down a problem into tasks and set research purpose",
    "研究資料作成活動": "Research material preparation",
    "記述する": "Describe",
    "資料作成＿メタ認知活動": "Material preparation / Metacognitive activity",
    "資料作成＿行動＿素活動": "Material preparation / Behavior / Elementary activity",
    "資料作成＿認知活動＿素活動": "Material preparation / Cognitive activity / Elementary activity",
    "メタ認知的知識": "Metacognitive knowledge",
    "疑問": "Question",
    "補足の説明を記述する": "Describe additional explanation",
    "提案を記述する": "Describe proposal",
    "事実を記述する": "Describe fact",
    "資料に記述すべきか考える": "Consider whether to include this in the materials",
    "研究MT資料を作成する_2": "Prepare research meeting materials / 2",
    "前回のMT内容を振り返る_2": "Review the previous meeting / 2",
    "議論目的_2": "Discussion purpose / 2",
    "定義": "Definition",
    "選択": "Choice",
    "資料作成＿行動＿複合活動": "Material preparation / Behavior / Composite activity",
    "疑問を記述する": "Describe question",
    "推測を記述する": "Describe inference",
    "定義を記述する": "Describe definition",
    "議論目的を記述する": "Describe discussion purpose",
    "文章が持つメタ認知的知識を考える": "Consider the metacognitive knowledge in the text",
    "変更点を明確にする": "Clarify changes",
    "変更点": "Changes",
    "補足": "Supplement",
    "共有": "Sharing",
    "資料作成＿認知活動": "Material preparation / Cognitive activity",
    "資料作成＿行動": "Material preparation / Behavior",
    "資料作成＿メタ認知活動＿素活動": "Material preparation / Metacognitive activity / Elementary activity",
    "資料作成＿メタ認知活動＿複合活動": "Material preparation / Metacognitive activity / Composite activity",
    "資料作成＿認知活動＿複合活動": "Material preparation / Cognitive activity / Composite activity",
    "根拠": "Evidence",
    "関連研究_2": "Related research / 2",
    "共有目的": "Sharing purpose",
    "記述理由": "Reason for description",
    "確認": "Confirmation",
    "選択を記述する": "Describe choice",
    "指針を記述する": "Describe guidelines",
    "共有内容を記述する": "Describe shared content",
    "前提を記述する": "Describe premise",
    "確認内容を記述する": "Describe items to check",
    "根拠を記述する": "Describe evidence",
    "理由を記述する": "Describe reasons",
    "具体例を記述する": "Describe examples",
    "具体例": "Examples",
    "事実を考える": "Consider fact",
    "議論目的を考える": "Consider discussion purpose",
    "推測を考える": "Consider inference",
    "方針を考える": "Consider policy",
    "疑問を考える": "Consider question",
    "定義を考える": "Consider definition",
    "前述の文章の具体例を考える": "Consider examples of the preceding text",
    "記述理由を考える": "Consider reason for description",
    "前提を考える": "Consider premise",
    "確認内容を考える": "Consider items to check",
    "メリット": "Advantages",
    "デメリット": "Disadvantages",
    "行為": "Action",
    "選択する": "Choose",
    "共有する": "Share",
    "方針": "Policy",
    "選択肢": "Options",
    "提案をする": "Make a proposal",
    "研究の着想を考える": "Consider research idea",
    "学習ドメインを考える": "Consider learning domain",
    "向上スキルを考える": "Consider skills to improve",
    "どのようなスキルの向上を目掛けていますか？": "What skills are you aiming to improve?",
    "学習ドメインはどのようなものですか？": "What is the learning domain?",
    "研究の着想はどのようなものですか？": "What is the research idea?",
    "実践の対象者を考える": "Consider practice participants",
    "実践対象者はどのような人を想定していますか？": "What kind of people are assumed as practice subjects?",
    "学習教材を考える": "Consider learning materials",
    "学習教材はどのようなものですか？": "What are the learning materials?",
    "研究の着想": "Research idea",
    "学習ドメイン": "Learning domain",
    "実践対象者": "Practice participants",
    "学習者": "Learner",
    "向上スキル": "Skills to improve",
    "学習教材": "Learning materials",
    "学習者が取り組む活動を考える": "Consider learner activities",
    "学習者が取り組む活動はどのようなものですか？": "What activities do learners engage in?",
    "システム上での学習者の入力情報を考える": "Consider learner input to the system",
    "システム上での学習者の入力はどのようなものですか？": "What kind of input do learners provide in the system?",
    "システムの内部処理を考える": "Consider internal system processing",
    "システムの内部処理はどのようなものですか？": "What is the internal processing of the system?",
    "システムの出力情報を考える": "Consider system output",
    "システムの出力情報はどのようなものですか？": "What is the output information of the system?",
    "システムへの入力情報": "System input",
    "システムの内部処理": "Internal system processing",
    "システムの出力情報": "System output",
    "聴衆モデル": "Audience model",
    "学びの困難性を考える": "Consider learning difficulties",
    "技術的な困難性を考える": "Consider technical difficulties",
    "学びの困難性はどのようなものですか？": "What are the difficulties in learning?",
    "技術的な困難性はどのようなものですか？": "What are the technical difficulties?",
    "困難性": "Difficulties",
    "研究目的達成のインパクトを考える": "Consider impact of achieving the research purpose",
    "研究目的達成のインパクトはどのようなものですか？": "What is the impact of achieving the research purpose?",
    "理想の学習者像を考える": "Consider ideal learner profile",
    "理想の学習者像はどのようなものですか？": "What is the ideal image of a learner?",
    "研究目的を設定する、実践の目的を考えるの合理性を考える": "Consider the rationality of set research purpose and consider practice purpose",
    "学びの困難性を考える、学習支援の方法を考えるの合理性を考える": "Consider the rationality of consider learning difficulties and consider learning support methods",
    "学習支援の方法を考える、システムのデザインを考えるの合理性を考える": "Consider the rationality of consider learning support methods and consider system design",
    "学習者像を考える、実践の対象者を考えるの合理性を考える": "Consider the rationality of consider learner profile and consider practice participants",
    "実践の仮説を考える、実践の対象者を考えるの合理性を考える": "Consider the rationality of consider practice hypothesis and consider practice participants",
    "学習者が取り組む活動": "Learner activities",
    "学びの困難性": "Learning difficulties",
    "聴衆モデル1（学士/未システム）": "Audience model 1 (Bachelor / system not implemented)",
    "聴衆モデル4（修士2年/システム）": "Audience model 4 (Second-year Master / system implemented)",
    "聴衆を意識する": "Consider the audience",
    "分野外の人を想定する": "Consider people outside the field",
    "信頼性を考える": "Consider reliability",
    "どのような信頼性がありますか？": "What kind of reliability does it have?",
    "場面": "Situation",
    "発表場面": "Presentation setting",
    "卒業論文発表": "Bachelor thesis presentation",
    "修士論文発表": "Master thesis presentation",
    "研究目的を設定する，今後の課題を考えるの合理性を考える": "Consider the rationality of set research purpose and consider future work",
    "今後の課題": "Future work",
    "人工知能学会": "Japanese Society for Artificial Intelligence",
    "プレゼン作成における目標": "Presentation preparation goals",
    "現時点で，研究目的をどの程度達成できたのか示すこと": "Show current progress toward the research purpose",
    "研究の骨子について納得を得ること": "Gain agreement on the research outline",
    "研究内容とその重要性を正確に伝えること": "Communicate the research and its importance accurately",
    "研究目的の達成に向けて未達成なことを，今後の課題として適切に位置付けること": "Position unfinished work toward the research purpose as future tasks",
    "プレゼンに対する聴衆の欲求": "Audience expectations for the presentation",
    "研究の成果を明確に理解したい": "Want to clearly understand the research outcomes",
    "プレゼンテーションを行う": "Give a presentation",
    "プレゼンテーション資料を作成する": "Prepare presentation materials",
    "プレゼンテーション資料": "Presentation materials",
    "根拠を考える": "Consider evidence",
    "根拠は何ですか？": "What is the basis?",
    "主張を考える": "Consider claim",
    "主張は何ですか？": "What is the claim?",
    "主題を設定する": "Set theme",
    "素目標": "Elementary goal",
    "複合目標": "Composite goal",
    "研究の要点を捉えて，大筋を理解したい": "Want to grasp the key points and overall research",
    "研究目的に対して実践目的が妥当であること": "Validity of the practice purpose relative to the research purpose",
    "学びの困難性の具体例を通じて，着目した問題に共感を得ること": "Build understanding of the problem through examples of learning difficulties",
    "信頼性": "Reliability",
    "新規性を考える": "Consider novelty",
    "主張の信頼性を示すこと": "Demonstrate the reliability of claims",
    "他の研究と比較して，提案内容が従来にない新しいものであると示すこと": "Demonstrate the novelty of the proposal compared with other research",
    "自分が取り組んだことを明確に示すこと": "Clearly show your own contributions",
    "他の研究と比較して，提案内容が学習により役立つと示すこと": "Show greater learning benefits compared with other research",
    "関連研究と位置付けて研究の意義を伝えること": "Explain the research significance in relation to related work",
    "提案内容が学習に役立つと示すこと": "Show how the proposal supports learning",
    "どのような新規性がありますか？": "What kind of novelty does it have?",
    "関連研究との違い": "Differences from related research",
    "研究の新しい進捗を考える": "Consider new research progress",
    "研究の新しい進捗はどのようなものですか？": "What are the new research developments?",
    "学習者像": "Learner profile",
    "関連研究との違いはどのようなものですか？": "What are the differences from related research?",
    "システムの良さを理解したい": "Want to understand the system benefits",
    "解決手法は具体的に何ですか？": "What is the specific solution method?",
    "関連研究を考える": "Consider related research",
    "関連研究はどのようなものがありますか？": "What related research exists?",
    "構想段階のシステムの仕様を示すこと": "Present the specifications of the proposed system",
    "システムの仕様を示すこと": "Present the system specifications",
    "聴衆モデル5（博士/システム）": "Audience model 5 (Doctoral / system implemented)",
    "聴衆モデル3（修士1年/未システム）": "Audience model 3 (First-year Master / system not implemented)",
    "聴衆モデル2（学士/システム）": "Audience model 2 (Bachelor / system implemented)",
    "今後の研究計画を実行性のある形で示すこと": "Present a feasible plan for future research",
    "学位論文に向けた研究計画を示すこと": "Present a research plan toward the thesis",
    "研究計画を考える": "Consider research plan",
    "研究計画はどのようなものですか？": "What is the research plan?",
    "研究計画": "Research plan",
    "研究計画を適切に考えているか知りたい": "Want to know whether the research plan is appropriate",
    "システムの知的さを示すこと": "Demonstrate the system intelligence",
    "システムの知的さを考える": "Consider system intelligence",
    "システムの知的さは何ですか？": "What is the intelligence of the system?",
    "自分のスキルに対して妥当な研究計画を示すこと": "Present a research plan appropriate to your skills",
    "知的学習支援分野における，構想段階のシステムの特長を示すこと": "Present the proposed system features in intelligent learning support",
    "知的学習支援分野における，システムの特長を示すこと": "Present the system features in intelligent learning support",
    "構想段階のシステムの知的さを示すこと": "Demonstrate the intelligence of the proposed system",
    "構想段階のシステムの良さを理解したい": "Want to understand the proposed system benefits",
    "研究の価値を伝えること": "Communicate the research value",
    "夏季成果報告会（修士2年）": "Summer research progress meeting (Second-year Master)",
    "夏季成果報告会（修士1年）": "Summer research progress meeting (First-year Master)",
    "夏季成果報告会": "Summer research progress meeting",
    "夏季成果報告会（博士）": "Summer research progress meeting (Doctoral)",
    "夏季成果報告会（学士）": "Summer research progress meeting (Bachelor)",
    "研究として取り組んだことの意義が知りたい": "Want to understand the significance of the research contributions",
    "学術的にどのような価値があるか知りたい": "Want to understand the academic value",
    "聴衆モデル6": "Audience model 6",
    "聴衆モデル7": "Audience model 7",
    "学習デザインの合理性を理解したい": "Want to understand the rationality of the learning design",
    "学習支援システムのデザインの合理性を理解したい": "Want to understand the rationality of the learning support system design",
    "学習者モデル": "Learner model",
    "学習者モデルを考える": "Consider learner model",
    "学習者モデルはどのようなものですか？": "What is the learner model?",
    "教授戦略": "Teaching strategy",
    "教授戦略を考える": "Consider teaching strategy",
    "教授戦略はどのようなものですか？": "What is the teaching strategy?",
    "システムの支援機能を考える": "Consider system support functions",
    "支援機能": "Support functions",
    "システムの支援機能はどのようなものですか？": "What are the support functions of the system?",
    "学習デザインの合理性を伝えること": "Explain the rationality of the learning design",
    "学習目標に対して教授戦略が合理的であること": "Rationality of teaching strategies relative to learning objectives",
    "学習目標に対して学習課題が合理的であること": "Rationality of learning tasks relative to learning objectives",
    "学習目標に対して学習活動が合理的であること": "Rationality of learning activities relative to learning objectives",
    "学習支援システムの合理性を伝えること": "Explain the rationality of the learning support system",
    "学びの困難性と支援機能が合理的であること": "Rationality of support functions relative to learning difficulties",
    "学習課題を考える": "Consider learning tasks",
    "学習課題": "Learning tasks",
    "学習課題はどのようなものですか？": "What are the learning tasks?",
    "学習目標を設定する，学習者が取り組む活動を考えるの合理性を考える": "Consider the rationality of set learning objectives and consider learner activities",
    "学習目標を設定する，学習課題を考えるの合理性を考える": "Consider the rationality of set learning objectives and consider learning tasks",
    "学習目標を設定する，教授戦略を考えるの合理性を考える": "Consider the rationality of set learning objectives and consider teaching strategy",
    "学びの困難性を考える，システムの支援機能を考えるの合理性を考える": "Consider the rationality of consider learning difficulties and consider system support functions",
    "提案を考える": "Consider proposal",
    "指針を考える": "Consider guidelines",
    "対案を考える": "Consider alternative proposal",
    "仮説を考える": "Consider hypothesis",
    "妥当性について考える": "Consider validity",
    "合理性について考える": "Consider rationality",
    "推測関係について考える": "Consider inferential relationship",
    "議論目的にそった指針を考える": "Consider guidelines aligned with the discussion purpose",
    "根拠と主張の妥当性を考える": "Consider validity of evidence and claims",
    "前提と提案の合理性を考える": "Consider rationality of premises and proposals",
    "事実に基づいた推測をする": "Infer from facts",
    "主張を支える根拠を考えられていますか？": "Is the basis for the claim considered?",
    "提案と前提の合理性について考えられていますか？": "Is the rationality of the proposal and premise considered?",
    "事実に基づいて推測を考えられていますか？": "Is the speculation based on facts considered?",
    "議論目的に沿った指針を考えられていますか？": "Are guidelines in line with the discussion purpose considered?",
    "メタ認知的知識_相対的知識": "Metacognitive knowledge / Relational knowledge",
    "前提": "Premise",
    "仮説": "Hypothesis",
    "事実": "Fact",
    "推測": "Inference",
    "提案": "Proposal",
    "主張": "Claim",
    "判断": "Judgment",
    "指針": "Guidelines",
    "仮説を立てる": "Form a hypothesis",
    "推測する": "Infer",
    "提案する": "Propose",
    "主張する": "Make a claim",
    "判断する": "Judge",
    "考える": "Think",
    "関係性について考える": "Consider relationships",
    "資料作成_認知活動_複合活動_相対的活動": "Material preparation / Cognitive activity / Composite activity / Relational activity",
    "前提を根拠として仮説を立てる": "Form a hypothesis based on premise",
    "前提を根拠として推測する": "Infer based on premise",
    "前提を根拠として提案する": "Propose based on premise",
    "前提を根拠として主張する": "Make a claim based on premise",
    "前提を根拠として判断する": "Judge based on premise",
    "仮説を根拠として推測する": "Infer based on hypothesis",
    "仮説を根拠として提案する": "Propose based on hypothesis",
    "仮説を根拠として主張する": "Make a claim based on hypothesis",
    "仮説を根拠として判断する": "Judge based on hypothesis",
    "事実を根拠として仮説を立てる": "Form a hypothesis based on fact",
    "事実を根拠として推測する": "Infer based on fact",
    "事実を根拠として提案する": "Propose based on fact",
    "事実を根拠として主張する": "Make a claim based on fact",
    "事実を根拠として判断する": "Judge based on fact",
    "推測を根拠として仮説を立てる": "Form a hypothesis based on inference",
    "提案を根拠として仮説を立てる": "Form a hypothesis based on proposal",
    "主張を根拠として仮説を立てる": "Form a hypothesis based on claim",
    "判断を根拠として仮説を立てる": "Form a hypothesis based on judgment",
    "指針を根拠として判断する": "Judge based on guidelines",
    "推測を根拠として推測する": "Infer based on inference",
    "推測を根拠として提案する": "Propose based on inference",
    "推測を根拠として主張する": "Make a claim based on inference",
    "推測を根拠として判断する": "Judge based on inference",
    "提案を根拠として推測する": "Infer based on proposal",
    "提案を根拠として主張する": "Make a claim based on proposal",
    "提案を根拠として判断する": "Judge based on proposal",
    "仮説を根拠として仮説を立てる": "Form a hypothesis based on hypothesis",
    "主張を根拠として推測する": "Infer based on claim",
    "主張を根拠として提案する": "Propose based on claim",
    "主張を根拠として判断する": "Judge based on claim",
    "判断を根拠として推測する": "Infer based on judgment",
    "判断を根拠として提案する": "Propose based on judgment",
    "判断を根拠として主張する": "Make a claim based on judgment",
    "主張と": "Claim and",
    "提案と仮説の妥当性について考える": "Consider validity of proposals and hypotheses",
    "事実[自身]": "Fact [self]",
    "事実[世の中]": "Fact [world]",
    "推測[自身]": "Inference [self]",
    "仮説[自身]": "Hypothesis [self]",
    "推測[世の中]": "Inference [world]",
    "仮説[世の中]": "Hypothesis [world]",
    "推測[自身]を考える": "Consider inference [self]",
    "推測[世の中]を考える": "Consider inference [world]",
    "事実[自身]を考える": "Consider fact [self]",
    "事実[世の中]を考える": "Consider fact [world]",
    "仮説[自身]を考える": "Consider hypothesis [self]",
    "仮説[世の中]を考える": "Consider hypothesis [world]",
    "メタ認知的知識_単体的知識": "Metacognitive knowledge / Individual knowledge"
};

function translateThinkingProcessConceptLabel(original, lang) {
    const displayLang = lang || window.currentLang || 'ja';
    if (displayLang === 'en' && Object.prototype.hasOwnProperty.call(thinkingProcessOntologyEnglish, original)) {
        return thinkingProcessOntologyEnglish[original];
    }
    const translated = translateThinkingProcessText(original, displayLang);
    return translated !== original ? translated
        : (window.translateInquiryText ? window.translateInquiryText(original, displayLang) : original);
}

function createThinkingProcessTriggerTitle(id, label, type, timestamp, container) {
    const title = container || document.createElement('div');
    // Keep the original separately so switching languages never rewrites user content or DB payloads.
    title._forestTrigger = {id: id, label: String(label || ''), type: type, timestamp: timestamp};
    title.setAttribute('data-trigger-display-lang', window.currentLang || 'ja');
    const displayType = translateThinkingProcessText(type);
    let displayLabel = String(label || '');
    const prefix = displayLabel.match(/^【([^】]+)】/);
    if (prefix && prefix[1].endsWith('：' + type)) {
        const prefixTime = prefix[1].slice(0, -String(type).length - 1);
        displayLabel = '【' + prefixTime + '：' + displayType + '】' + displayLabel.slice(prefix[0].length);
    }
    title.innerHTML = '';
    const item = document.createElement('div');
    item.id = id;
    item.className = 'trigger_title';
    item.setAttribute('timestamp', timestamp);
    const heading = document.createElement('b');
    heading.textContent = displayType;
    item.appendChild(heading);
    item.appendChild(document.createElement('br'));
    const body = document.createElement('div');
    // Historical labels contain the system-generated <br> prefix and may contain rich text.
    body.innerHTML = displayLabel;
    item.appendChild(body);
    title.appendChild(item);
    return title;
}
window.createThinkingProcessTriggerTitle = createThinkingProcessTriggerTitle;

function applyThinkingProcessDisplayLanguage() {
    document.querySelectorAll('[data-trigger-system-text]').forEach(function(element) {
        element.textContent = translateThinkingProcessText(element.getAttribute('data-trigger-system-text'));
    });
    document.querySelectorAll('[data-trigger-concept-label]').forEach(function(element) {
        const original = element.getAttribute('data-trigger-concept-label');
        element.textContent = translateThinkingProcessConceptLabel(original);
    });
    const maps = [];
    if (typeof defaultThinkingProcess !== 'undefined' && defaultThinkingProcess) maps.push(defaultThinkingProcess);
    if (typeof defaultOrganizational !== 'undefined' && defaultOrganizational) maps.push(defaultOrganizational);
    maps.forEach(function(map) {
        if (!map.nodes || typeof map.nodes.get !== 'function') return;
        const updates = [];
        map.nodes.get().forEach(function(node) {
            const title = node.title;
            if (node.group !== 'trigger' || !title || !title._forestTrigger
                || title.getAttribute('data-trigger-display-lang') === (window.currentLang || 'ja')) return;
            const original = title._forestTrigger;
            createThinkingProcessTriggerTitle(original.id, original.label, original.type, original.timestamp, title);
            updates.push({id: node.id, title: title});
        });
        if (updates.length) map.nodes.update(updates);
    });
}
window.applyThinkingProcessDisplayLanguage = applyThinkingProcessDisplayLanguage;


// 議論内省マップに関する処理プログラム
let defaultThinkingProcess;
let defaultRecordThinkingProcess;
let defaultShowThinkingProcess;

function getLessonPromptDefinitions(){
    return [
        {
            stageName: 'stage1',
            titleText: '【経験の振り返り】',
            parts: [
                { placeholder: 'どのように' },
                '考えたことで，',
                { placeholder: '何' },
                'が達成された．'
            ]
        },
        {
            stageName: 'stage2',
            titleText: '【活動文脈固有の振り返り】',
            parts: [
                '現在の思考の文脈で',
                { placeholder: 'どのように考えること/取り組むこと（手段）' },
                'が，研究活動の',
                { placeholder: '何に資する（目的）' },
                '．'
            ]
        },
        {
            stageName: 'stage3',
            titleText: '【研究固有の振り返り】',
            parts: [
                '研究に取り組むとき，',
                { placeholder: '何を考える/取り組むこと（目的）' },
                'が大切で，そのために，',
                { placeholder: '何をどのようにどのような観点から考える/取り組むこと（手段）' },
                'が効果的である．'
            ]
        }
    ];
}

function splitLessonStageText(stageText, parts){
    const text = (stageText || '').trim();
    const inputCount = parts.filter((part) => typeof part !== 'string').length;
    if (!text) return new Array(inputCount).fill('');

    const values = new Array(inputCount).fill('');
    let position = 0;
    let inputIndex = 0;

    parts.forEach((part, partIndex) => {
        if (typeof part === 'string') {
            if (text.indexOf(part, position) === position) {
                position += part.length;
                return;
            }

            const foundIndex = text.indexOf(part, position);
            if (foundIndex !== -1) {
                position = foundIndex + part.length;
            }
            return;
        }

        const nextLiteral = parts.slice(partIndex + 1).find((nextPart) => typeof nextPart === 'string');
        if (!nextLiteral) {
            values[inputIndex] = text.slice(position).trim();
            position = text.length;
            inputIndex += 1;
            return;
        }

        const nextLiteralIndex = text.indexOf(nextLiteral, position);
        if (nextLiteralIndex === -1) {
            values[inputIndex] = text.slice(position).trim();
            position = text.length;
        } else {
            values[inputIndex] = text.slice(position, nextLiteralIndex).trim();
            position = nextLiteralIndex;
        }
        inputIndex += 1;
    });

    return values;
}

function createLessonStagePrompt(stageDefinition, initialStageText){
    const titleEl = document.createElement('h5');
    titleEl.className = 'lesson-heading-stage';
    titleEl.textContent = stageDefinition.titleText;

    const prompt = document.createElement('div');
    prompt.setAttribute('data-stage-block', 'true');
    prompt.setAttribute('data-stage', stageDefinition.stageName);

    const inputValues = splitLessonStageText(initialStageText, stageDefinition.parts);
    let inputIndex = 0;
    stageDefinition.parts.forEach((part) => {
        if (typeof part === 'string') {
            prompt.appendChild(document.createTextNode(part));
        } else {
            const input = document.createElement('textarea');
            input.className = 'lessonTextArea';
            input.rows = 1;
            input.placeholder = part.placeholder || '';
            input.value = inputValues[inputIndex] || '';
            inputIndex += 1;
            prompt.appendChild(input);
        }
    });

    return { titleEl, prompt };
}

function renderLessonForm(initialValues){
    const area = document.getElementById('area_lesson_add');
    if (!area) return;

    const values = initialValues || {};
    area.innerHTML = '';

    const title = document.createElement('h5');
    title.className = 'lesson-heading-title';
    title.textContent = '経験知の要約';

    const textarea = document.createElement('textarea');
    textarea.className = 'lessonTextArea';
    textarea.name = 'knowledge_fragment_title';
    textarea.placeholder = 'どんなことを学んだかの要約を入力してください';
    textarea.value = values.knowledge_fragment_title || '';

    area.insertBefore(title, area.firstChild);
    area.appendChild(document.createElement('br'));
    area.appendChild(textarea);

    getLessonPromptDefinitions().forEach((stageDefinition) => {
        const stage = createLessonStagePrompt(stageDefinition, values[stageDefinition.stageName] || '');
        area.appendChild(stage.titleEl);
        area.appendChild(stage.prompt);
    });
}

function collectLessonFormData(){
    const titleEl = document.querySelector('textarea.lessonTextArea[name="knowledge_fragment_title"]');
    const filteredContents = [];
    const stageBlocks = document.querySelectorAll('[data-stage-block="true"]');

    if (stageBlocks.length > 0) {
        stageBlocks.forEach((block) => {
            const stageName = block.getAttribute('data-stage') || 'stage';
            let value = '';
            block.childNodes.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    value += node.textContent;
                } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'TEXTAREA') {
                    value += node.value || '';
                }
            });
            filteredContents.push({ type: stageName, content: value });
        });
    } else {
        const lessonAreas = document.getElementsByClassName('lessonTextArea');
        for (let i = 0; i < lessonAreas.length; i++) {
            const name = lessonAreas[i].name || ('text' + i);
            if (name === 'knowledge_fragment_title') continue;
            filteredContents.push({ type: name, content: lessonAreas[i].value || '' });
        }
    }

    return {
        knowledge_fragment_title: titleEl ? titleEl.value : '',
        contents: filteredContents
    };
}

function setLessonActionButton(value, handler){
    const actionButton = document.getElementById('lesson_action_button') || document.querySelector('#lesson_display .lessonbutton');
    if (!actionButton) return;
    actionButton.value = value;
    actionButton.onclick = handler;
}

function attachLessonDisplayToLessonArea(){
    const lesson = document.getElementById('lesson_display');
    const lessonArea = document.getElementById('lesson_area');
    if (!lesson || !lessonArea) return lesson;

    lesson.classList.remove('lesson-display-overlay');
    if (lesson.parentNode !== lessonArea) {
        lessonArea.appendChild(lesson);
    }
    return lesson;
}

function showLessonDisplayOverlay(){
    const lesson = document.getElementById('lesson_display');
    if (!lesson) return null;

    if (lesson.parentNode !== document.body) {
        document.body.appendChild(lesson);
    }
    lesson.classList.add('lesson-display-overlay');
    lesson.style.display = 'block';
    return lesson;
}

window.renderLessonForm = renderLessonForm;
window.collectLessonFormData = collectLessonFormData;
window.setLessonActionButton = setLessonActionButton;
window.attachLessonDisplayToLessonArea = attachLessonDisplayToLessonArea;
window.showLessonDisplayOverlay = showLessonDisplayOverlay;
window.getLessonPromptDefinitions = getLessonPromptDefinitions;

class ThinkingProcess { // forestMRN: forest Meeting Reflection Network
    constructor(container, load) {
        // this.ownNetwork = this.generateThinkingProcessNetworkCanvas(container, {}, {}); // デフォルトのマップを表示

        defaultRecordThinkingProcess = new RecordThinkingProcess();
        this.containerId = container;
        this.nodes = new vis.DataSet();
        this.edges = new vis.DataSet();
        this.options = {
	        physics: false,
            nodes: {
                margin: 10,
                widthConstraint: {
                    maximum: 150
                },
            },
	        edges: {
		        arrows: 'to', // エッジに矢印を付けて有向グラフにする
		        smooth: false // falseにするとエッジが直線になる
            },
            interaction: {
                multiselect: true,
                zoomView: false // グラフの拡大縮小を無効にする
            },
        };
        this.nodeConnectEnabled = false; // マインドマップとの対応づけを可能にする（マインドマップのノードクリックが，議論内省マップノードとの対応を付与するのかそうでないのかを判定するよう）
        this.latest_selected_node_info = {
            x: 0,
            y: 35
        }; // 最後にクリックされたノードの情報
        this.output_input = {}; //オントロジーの入力と出力の対応付け
        this.output_list = [];  //概念として出すもの
        this.dragStartNodeId = null;  //ドラッグスタートしたノードのID
        this.dragEndNodeId = null; //ドラッグエンドしたノードID
        this.edgeEditMode = false; // リンクを編集できるかどうかのモード（Falseは編集不可）
        this.EdgeStartId = []; //エッジの開始ID
        this.EdgeEndId = []; //エッジの終了ID
        this.OntologyNodeId = []; //オントロジーノードのノードID
        this.OntologyConnectNodeId = []; //オントロジーノードと対応づいているノードID
        // this.ConnectNetworkNodeId = [];
        // this.ConnectMindMapNodeId = [];
        // this.RecruitNodeId = [];//採用or棄却されたノードID
        // this.Recruit = [];//採用or棄却
        // this.Feedback = [];//フィードバック書いたかどうか
        // this.FeedbackNodeId = null; //フィードバック書かれるノードID
        this.selectId = null;//選択されたノードID
        // this.interval = null; //インターバル抜けるための変数
        this.material_id = null;
        this.concept_id = null;
        this.scale = 1;
        this.BoxDisplay = {
            x: 0,
            y: 0
        }//右クリックされやメニューの表示場所
        this.ownNetwork = this.generateThinkingProcessNetworkCanvas(container, this.nodes, this.edges); // デフォルトのマップを表示
        this.choose_input_xmlLoad();
        if(load == "load"){
            this.jmindex = [];
            this.addEventLister();
            // $(`#jsmind_container`).on('click',this.connect_mindmap.bind(this));
            // $(`#process_conmenu1`).on('click',this.openLessonAreaOpen.bind(this));
            // $(`#process_conmenu2`).on('click',this.connect_network.bind(this));
            // $(`#process_conmenu3`).on('click',this.Recruit_Idea.bind(this));
            $(`#process_conmenu4`).on('click',this.ContentmenuCancel.bind(this));
            // $(`#p_ontology_select`).on('click',this.addontology.bind(this));
            // $(`#p_recruit_select`).on('click',this.Selected_Recruit_Idea.bind(this));
            this.ownNetwork.on('click', this.networkClick.bind(this));
            this.ownNetwork.on('dragStart', this.dragstart.bind(this));
            this.ownNetwork.on('dragEnd', this.dragend.bind(this));
            this.ownNetwork.on('doubleClick', this.doubleclick.bind(this));
            this.ownNetwork.on("oncontext", this.onContext.bind(this));
            this.ownNetwork.on('select', this.selectdelete.bind(this));
        }
        this.choose_input_xmlLoad();
    }


    choose_input_xmlLoad(){
        $.ajax({
            url:'js/hozo.xml',
            type:'get',
            dataType:'xml',
            timeout:1000,
            success:this.choose_input_parse_xml.bind(this)
        });
    }

    choose_input_parse_xml(xml,status){
        if(status!='success')return;
        const XML = $(xml).find('W_CONCEPTS');
        const label = Array.from(XML[0].getElementsByTagName('LABEL'));
        const isa = Array.from(XML[0].getElementsByTagName('ISA'));
        const rationaly_record = (return_slot) => {
            let rationaly_label;
            let input_count = 0;
            for(var i=0; i<return_slot.length; i++){
                if(return_slot[i].getAttribute("role") === "入力"){
                    label.map((content_label2) => {
                        if(return_slot[i].getAttribute('class_constraint') === content_label2.childNodes[0].nodeValue){
                            const slot_content = Array.from(content_label2.parentNode.getElementsByTagName("SLOT"));
                            slot_content.map((content_slot2) => {
                                if(content_slot2.getAttribute("role") === "出力"){
                                    if(!this.output_list.includes(content_slot2.getAttribute("class_constraint"))) {
                                        this.output_list.push(content_slot2.getAttribute("class_constraint"));
                                    }
                                    if(input_count == 0){
                                        rationaly_label = content_slot2.getAttribute("class_constraint");
                                    }else{
                                        this.output_input[rationaly_label] = content_slot2.getAttribute("class_constraint");
                                        this.output_input[content_slot2.getAttribute("class_constraint")] = rationaly_label;
                                    }
                                }
                            });
                        return;
                        }
                    });
                    input_count += 1;
                }
            }
        }
        //hozo.xmlファイルのタグを検索して変数に格納（たぶん，全てのタグが配列で格納されている），thisはhozo.xmlのことかな
        isa.map((content)=>{
            if(content.getAttribute('parent') === "合理性を考える"){
                label.map((content_label) => {
                    if(content.getAttribute('child') === content_label.childNodes[0].nodeValue){
                        rationaly_record(Array.from(content_label.parentNode.getElementsByTagName("SLOT")))
                        return;
                    }
                })
            }
        });
        // const selectElement = document.getElementById("selectionlist");
        // while (selectElement.options.length > 0) {
        //     selectElement.remove(0);
        // }
        // this.output_list.map((n) => {
        //     const optionElement = document.createElement('option');
        //     optionElement.value = n;
        //     optionElement.text = n;
        //     selectElement.appendChild(optionElement);
        // })
    }

    // //オントロジーノードを選択不可に
    selectdelete(params) {
        const selectedNode = this.nodes.get(params.nodes[0]);
        if (!selectedNode) {
            return;
        }
        if (selectedNode.shape == "ellipse" || selectedNode.group == "versionTime") {
            // 選択を解除
            this.ownNetwork.setSelection({ nodes: [] });
        }
    }

    addEventLister(){
        this.bindopenLessonAreaOpen = this.openLessonAreaOpen.bind(this);
        // this.bindshow_select = this.show_select.bind(this);
        // this.bindconnect_network = this.connect_network.bind(this);
        // this.bindRecruit_Idea = this.Recruit_Idea.bind(this);
        this.bindContentmenuCancel = this.ContentmenuCancel.bind(this);
        // this.bindaddontology = this.addontology.bind(this);
        // this.bindSelected_Recruit_Idea = this.Selected_Recruit_Idea.bind(this);
        // this.bindfeedback = this.feedback.bind(this);
        // this.bindNodeblinking = this.Nodeblinking.bind(this);
        // $(`#jsmind_container`).on('click',this.bindconnect_mindmap);
        $(`#process_conmenu1`).on('click',this.bindopenLessonAreaOpen);
        // $(`#process_conmenu2`).on('click',this.bindconnect_network);
        // $(`#process_conmenu3`).on('click',this.bindRecruit_Idea);
        $(`#process_conmenu4`).on('click',this.bindContentmenuCancel);
        // $(`#p_ontology_select`).on('click',this.bindaddontology);
        // $(`#p_recruit_select`).on('click',this.bindSelected_Recruit_Idea);
        // $(`#feedbackrecord`).on('click',this.bindfeedback);
        // this.interval = setInterval(this.bindNodeblinking, 1000);
    }

    removeEventLister(){
        // $(`#jsmind_container`).off('click',this.bindconnect_mindmap);
        $(`#process_conmenu1`).off('click',this.bindopenLessonAreaOpen);
        // $(`#process_conmenu2`).off('click',this.bindconnect_network);
        // $(`#process_conmenu3`).off('click',this.bindRecruit_Idea);
        $(`#process_conmenu4`).off('click',this.bindContentmenuCancel);
        // $(`#p_ontology_select`).off('click',this.bindaddontology);
        // $(`#p_recruit_select`).off('click',this.bindSelected_Recruit_Idea);
        // $(`#feedbackrecord`).off('click',this.bindfeedback);
        // clearInterval(this.interval);
    }
    /*
     * マップ編集ユーティリティ
     */
    generateUniqueNumberText() {
        return `${new Date().getTime()}${Math.floor(1000000 * Math.random())}`;
    }

    setNodes(newNodes) {
        this.nodes = newNodes;
    }
    setEdges(newEdges) {
        this.edges = newEdges;
    }
    setOptions(options) {
        this.options = options;
    }

    //エッジ編集できるか切り替え
    SelectEditEdge(){
        this.edgeEditMode = !this.edgeEditMode;
        if(this.edgeEditMode){
            this.enableEditEdge();
        }else{
            this.disableEditEdge();
        }
    }

    //エッジ編集できる場合の処理
    enableEditEdge() {
        // エッジを編集するときは，ノードの動きを止める
        const edgeButton = document.getElementById("process_startEditEdge");
        if (edgeButton) {
            edgeButton.setAttribute('data-edge-editing', 'true');
            edgeButton.value = window.currentLang === 'en' ? 'Finish Adding Edges' : 'エッジ追加終了';
        }
        this.nodes.update(this.nodes.map(n => {
            return { ...n, fixed: true };
        }));     
    }

    //エッジ編集できない場合の処理
    disableEditEdge() {
        const edgeButton = document.getElementById("process_startEditEdge");
        if (edgeButton) {
            edgeButton.setAttribute('data-edge-editing', 'false');
            edgeButton.value = window.currentLang === 'en' ? 'Add Edge' : 'エッジ追加';
        }
        // エッジの編集モードを抜けたときは，ノードの動きを再度始める（ただし，タグノードはFixedにしておく）
        this.edgeEditMode = false;
        this.nodes.update(this.nodes.map(n => {
            return n.type !== "topic-tag" ? { ...n, fixed: false } : { ...n, fixed: true };
        }))
    }

    /*
     * 議論内省マップの表示・操作部分（Extend vis.js）
     */
    generateThinkingProcessNetworkCanvas (canvas_dom_id, nodes, edges) {
        // マップを表示

        this.setNodes(nodes);
        this.setEdges(edges);

        return new vis.Network(
            document.getElementById(canvas_dom_id),
            {
                nodes: nodes,
                edges: edges,
            },
            this.options
        );

        // this.setCanvasOptions(load);
        // return network;
    }

    /*
     * ノードの操作
     */
    //ノード追加(完了)
    addNode(node_id, node_label, node_type, node_x, node_y) {
        let node_color = '#f8e58c'; // ノードの背景色
        let node_shape = 'box';     // ノードの形状
        let text_color = 'black';   // ノード内文字列の色
        let position_fixed = false;   // ノードを動かせるかどうか（Falseなら動かせる）

        let result_label = '';
        for (let i = 0; i < node_label.length; i += 40) {
            result_label += node_label.substr(i, 40) + '\n';
        }
        result_label = result_label.trim(); // 末尾の不要な改行を除去
        const newNode = {
            id: node_id,
            label: result_label,
            group: node_type,
            color: node_color, shape: node_shape,
            font: { color: text_color },
            fixed: position_fixed,
            x: node_x, y: node_y, 
        };
        this.nodes.add(newNode);
        const boundingBox = this.ownNetwork.getBoundingBox(node_id);
        node_y += Math.floor(((boundingBox.bottom)-(boundingBox.top))/2);
        this.nodes.update({
            id : node_id,
            color: node_color,
            shape: node_shape,
            font: { color: text_color },
            y : node_y
        });
        const boundingBoxupdate = this.ownNetwork.getBoundingBox(node_id);
        this.latest_selected_node_info.x = node_x;
        this.latest_selected_node_info.y = boundingBoxupdate.bottom+10;
        defaultRecordThinkingProcess.record_Node(node_id, node_label, node_type, node_x, node_y);
        return this.nodes;
    }

    addReloadNode(node_id, node_label, node_type, node_x, node_y) {
        const existingNode = this.nodes.get(node_id);
        if (existingNode) {
            console.log(`Node with ID ${node_id} already exists. Skipping addition.`);
            return; // 重複がある場合は追加せずにリターン
        }
        let node_color = '#ffdb4f'; // ノードの背景色
        let node_shape = 'box';     // ノードの形状
        let text_color = 'black';   // ノード内文字列の色
        let position_fixed = false;   // ノードを動かせるかどうか（Falseなら動かせる）
        let result_label = '';
        for (let i = 0; i < node_label.length; i += 40) {
            result_label += node_label.substr(i, 40) + '\n';
        }
        result_label = result_label.trim(); // 末尾の不要な改行を除去
        const newNode = {
            id: `${node_id}`, label: result_label,
            group: node_type,
            color: node_color, shape: node_shape,
            font: { color: text_color },
            fixed: position_fixed,
            x: node_x, y: node_y, 
        };
        defaultThinkingProcess.nodes.add(newNode);
        const boundingBox = defaultThinkingProcess.ownNetwork.getBoundingBox(`${node_id}`);
        defaultThinkingProcess.latest_selected_node_info.x = node_x;
        defaultThinkingProcess.latest_selected_node_info.y = boundingBox.bottom+10;
        return defaultThinkingProcess.nodes;
    }

    addVersionNode(node_id, node_l, node_type, appeared_at, node_x, node_y, displayAsEmptyInitialVersion){
        const existingNode = defaultThinkingProcess.nodes.get(node_id);
        if (existingNode) {
            console.log(`Node with ID ${node_id} already exists. Skipping addition.`);
            return; // 重複がある場合は追加せずにリターン
        }
        let node_color = '#ffbaa1'; // ノードの背景色
        let node_shape = 'box';     // ノードの形状
        let text_color = 'black';   // ノード内文字列の色
        var y_fixed = true;
        let node_label;
        
        if(node_l == '<select name="change_labels" id="select_labels"><optgroup label="ラベル付与"><option value="node_labels">ラベル選択</option>          <option value="primary_label">主軸</option></optgroup><optgroup label="----L主軸"><option value="pl_1">---L有用性</option><option value="pl_2">---L新規性</option> <option value="pl_3">---L信頼性</option><option value="pl_0">---Lその他</option>                   </optgroup>              <option value="issue_label">課題</option> <optgroup label="----L未検討"> <option value="il_non_1">---L語の妥当性</option><option value="il_non_2">---L証拠の十分性</option><option value="il_non_3">---L論理の整合性</option><option value="il_non_0">---Lその他</option></optgroup><optgroup label="----L再検討"> <option value="il_re_1">---L語の妥当性</option><option value="il_re_2">---L証拠の十分性</option><option value="il_re_3">---L論理の整合性</option><option value="il_re_0">---Lその他</option></optgroup><option value="cl_0">整合性</option></select>'){
            node_label = "【ラベル選択】";
        }else{
            node_label = node_l
        }

        if(displayAsEmptyInitialVersion){
            node_label = '';
            node_color = {
                background: '#ffffff',
                border: '#aeb4ba',
                highlight: { background: '#ffffff', border: '#7f8790' },
                hover: { background: '#ffffff', border: '#7f8790' }
            };
        }

        if(node_type == "versionsBro"){
            if(!displayAsEmptyInitialVersion){
                node_color = '#ffd7c9'; // ノードの背景色
            }
            y_fixed = false;
        }

        const newNode = {
            id: `${node_id}`,
            label: node_label,
            group: node_type,
            appeared_at: appeared_at,
            color: node_color,
            shape: node_shape,
            font: { color: text_color },
            fixed: {y: y_fixed },
            x: node_x, y: node_y, 
        };
        if(displayAsEmptyInitialVersion){
            newNode.borderWidth = 1;
            newNode.shapeProperties = { borderDashes: [2, 4] };
        }
        // console.log(newNode);
        
        defaultThinkingProcess.nodes.add(newNode);
        if(appeared_at){
            defaultThinkingProcess.nodes.add({
                id: `${node_id}_appeared_at`,
                label: appeared_at,
                group: "versionTime",
                shape: "text",
                color: {
                    background: "rgba(255,255,255,0)",
                    border: "rgba(255,255,255,0)",
                    highlight: {
                        background: "rgba(255,255,255,0)",
                        border: "rgba(255,255,255,0)"
                    },
                    hover: {
                        background: "rgba(255,255,255,0)",
                        border: "rgba(255,255,255,0)"
                    }
                },
                font: { color: "#4d403c", size: 13 },
                borderWidth: 0,
                borderWidthSelected: 0,
                labelHighlightBold: false,
                shadow: false,
                fixed: {y: y_fixed },
                x: node_x,
                y: node_y + 20,
                margin: {
                    top: 2,
                    right: 6,
                    bottom: 2,
                    left: 6
                },
                chosen: false,
                physics: false
            });
            setTimeout(() => {
                const versionNodeBoundingBox = defaultThinkingProcess.ownNetwork.getBoundingBox(`${node_id}`);
                if(versionNodeBoundingBox && Number.isFinite(versionNodeBoundingBox.bottom) && defaultThinkingProcess.nodes.get(`${node_id}_appeared_at`)){
                    defaultThinkingProcess.nodes.update({
                        id: `${node_id}_appeared_at`,
                        x: (versionNodeBoundingBox.right + versionNodeBoundingBox.left)/2,
                        y: versionNodeBoundingBox.bottom + 20
                    });
                }
            }, 0);
        }
        return defaultThinkingProcess.nodes;
    }

    addVersionEdge(from_node_id, to_node_id){
        // let node_color = 'orange'; // ノードの背景色
        // let node_shape = 'box';     // ノードの形状
        // let text_color = 'black';   // ノード内文字列の色
        const newEdge = {
            from: from_node_id,
            to: to_node_id,
            group: "versionEdges",
            isDefaultVersionEdge: true,
            fixed: true,
        };
        defaultThinkingProcess.edges.add(newEdge);
        defaultThinkingProcess.removeSupersededVersionEdges();
        return defaultThinkingProcess.edges;

    }

    removeSupersededVersionEdges(){
        const versionNodeIds = {};
        this.nodes.forEach((node) => {
            if(node && (node.group === "versions" || node.group === "versionsBro")){
                versionNodeIds[String(node.id)] = true;
            }
        });

        const defaultVersionEdges = [];
        const adjacency = {};
        this.edges.forEach((edge) => {
            if(!edge || edge.from == null || edge.to == null) return;
            if(edge.isDefaultVersionEdge === true){
                defaultVersionEdges.push(edge);
                return;
            }
            const fromId = String(edge.from);
            const toId = String(edge.to);
            if(!adjacency[fromId]) adjacency[fromId] = [];
            adjacency[fromId].push(toId);
        });

        const hasAlternatePath = (fromId, toId) => {
            const queue = [{ id: String(fromId), includesOtherType: false }];
            const visited = {};
            while(queue.length > 0){
                const current = queue.shift();
                const visitKey = current.id + '|' + (current.includesOtherType ? '1' : '0');
                if(visited[visitKey]) continue;
                visited[visitKey] = true;

                const nextIds = adjacency[current.id] || [];
                for(let i = 0; i < nextIds.length; i++){
                    const nextId = nextIds[i];
                    const includesOtherType = current.includesOtherType || !versionNodeIds[nextId];
                    if(nextId === String(toId) && includesOtherType) return true;
                    const nextVisitKey = nextId + '|' + (includesOtherType ? '1' : '0');
                    if(!visited[nextVisitKey]){
                        queue.push({ id: nextId, includesOtherType: includesOtherType });
                    }
                }
            }
            return false;
        };

        const removeIds = defaultVersionEdges
            .filter((edge) => hasAlternatePath(edge.from, edge.to))
            .map((edge) => edge.id);
        if(removeIds.length > 0){
            this.edges.remove(removeIds);
        }
    }

    addTriggerNode(flag, trigger_id, edge_id, from_node, to_node, activity_id, t_label, t_type, t_time, node_x, node_y){
        let color = '#82ae46'; // ノードの背景色
        let node_shape = 'circularImage';     // ノードの形状
        var DIR_img = "../image/triggers/"; //ノードのアイコンとなる画像のパス
        let image = "thinking.png"; 
        const t_title = document.createElement("div");  // titleのHTML

        if(!activity_id){
            color = '#60bfa3'; // ノードの背景色
        }

        createThinkingProcessTriggerTitle(trigger_id, t_label, t_type, t_time, t_title);
        const fromNodeForPosition = defaultThinkingProcess.nodes.get(from_node);
        const toNodeForPosition = defaultThinkingProcess.nodes.get(to_node);
        if(node_x == null || !Number.isFinite(Number(node_x))){
            const fromBox = defaultThinkingProcess.ownNetwork.getBoundingBox(from_node);
            const toBox = defaultThinkingProcess.ownNetwork.getBoundingBox(to_node);
            const fromX = fromNodeForPosition && Number.isFinite(fromNodeForPosition.x) ? fromNodeForPosition.x : (fromBox.left + fromBox.right) / 2;
            const toX = toNodeForPosition && Number.isFinite(toNodeForPosition.x) ? toNodeForPosition.x : (toBox.left + toBox.right) / 2;
            node_x = (Number.isFinite(fromX) && Number.isFinite(toX)) ? (fromX + toX) / 2 : 0;
        }
        if(node_y == null || !Number.isFinite(Number(node_y))){
            const fromBox = defaultThinkingProcess.ownNetwork.getBoundingBox(from_node);
            const toBox = defaultThinkingProcess.ownNetwork.getBoundingBox(to_node);
            const fromY = fromNodeForPosition && Number.isFinite(fromNodeForPosition.y) ? fromNodeForPosition.y : (fromBox.top + fromBox.bottom) / 2;
            const toY = toNodeForPosition && Number.isFinite(toNodeForPosition.y) ? toNodeForPosition.y : (toBox.top + toBox.bottom) / 2;
            node_y = (Number.isFinite(fromY) && Number.isFinite(toY)) ? (fromY + toY) / 2 : Math.floor(Math.random()*200)-100;
        }

        //triggerとなった活動ごとにアイコンを変更
        switch(t_type) {
            case "自己内対話": //自己内対話
                break;
            case "議論資料作成": //議論資料作成
                image = "writing.png";
                break;
            case "議論内省": //議論内省
                image = "meeting.png";
                break;
            case "論文読解": //論文読解
                image = "reading.png";
                break;
            case "論文執筆": //論文執筆
                image = "writing-scholar.png";
                break;
            default: // その他
                break;
        }

        const hasStoredFromEdge = defaultThinkingProcess.edges.get().some((edge) => {
            return edge
                && edge.isDefaultVersionEdge !== true
                && String(edge.from) === String(from_node)
                && String(edge.to) === String(trigger_id);
        });
        const hasStoredToEdge = defaultThinkingProcess.edges.get().some((edge) => {
            return edge
                && edge.isDefaultVersionEdge !== true
                && String(edge.from) === String(trigger_id)
                && String(edge.to) === String(to_node);
        });

        // trigger_fromの設定
        const targetEdge = edge_id ? defaultThinkingProcess.edges.get(edge_id) : null;
        if(hasStoredFromEdge){
            // DBから読み込んだエッジをそのまま使用する。
        }else if(targetEdge && (targetEdge.group == "trigger_from" || targetEdge.group == "trigger_to")){
            // エッジの先がtrigger_nodeならその先のversion_nodeに繋ぐ
            //　trigge自身を指す新しいエッジを追加
            const newEdge = {
                from: from_node,
                to: trigger_id,
                arrows: 'to',
                color: color,
                group: "trigger_from",
                isDefaultVersionEdge: false,
                smooth: false,
                fixed: true,
            };
            if(targetEdge.group == "trigger_to"){
                targetEdge.to = trigger_id;
                targetEdge.group = "trigger_from";
                targetEdge.isDefaultVersionEdge = false;
                targetEdge.smooth = false;
                targetEdge.arrows = 'to';
                targetEdge.color = color;
                defaultThinkingProcess.edges.update(targetEdge);
            }else{
                defaultThinkingProcess.edges.add(newEdge);
            }

        }else if(targetEdge && targetEdge.group == "versionEdges"){
            // 既存のversionEdgeをtrigger自身を指すようにエッジを繋ぎかえ
            const update_edge = targetEdge;
            update_edge.arrows = 'to';
            update_edge.color = color;
            update_edge.to = trigger_id;
            update_edge.group = "trigger_from";
            update_edge.isDefaultVersionEdge = false;
            update_edge.smooth = false;
            defaultThinkingProcess.edges.update(update_edge);
        }else{
            const newEdge = {
                id: `${trigger_id}_from`,
                from: from_node,
                to: trigger_id,
                arrows: 'to',
                color: color,
                group: "trigger_from",
                isDefaultVersionEdge: false,
                smooth: false,
                fixed: true,
            };
            defaultThinkingProcess.edges.add(newEdge);
        }

        //　trigger_toの設定
        if(!hasStoredToEdge){
            const newEdge = {
                from: trigger_id,
                to: to_node,
                arrows: 'to',
                color: color,
                group: "trigger_to",
                isDefaultVersionEdge: false,
                smooth: false,
                fixed: true,
            };
            defaultThinkingProcess.edges.add(newEdge);
        }

        //triggerとなるノードを追加（既に存在するIDは追加せず更新する）
        const newNode = {
            id: trigger_id,
            label: t_time,
            title: t_title,
            group: "trigger",
            type: t_type,
            color: color,
            shape: node_shape,
            image: DIR_img + image,
            imagePadding: 7,
            fixed: false,
            x: node_x, y: node_y,
        };

        const existingNode = defaultThinkingProcess.nodes.get(trigger_id);
        if (existingNode) {
            // merge new properties into existing node
            defaultThinkingProcess.nodes.update(Object.assign({id: trigger_id}, newNode));
        } else {
            defaultThinkingProcess.nodes.add(newNode);
        }

        if(flag == "New"){
            const mapNodeId = getOpenThinkingProcessNodeId();
            defaultRecordThinkingProcess.record_trigger(trigger_id, activity_id, mapNodeId, from_node, to_node, t_time, t_type, t_label, node_x, node_y);
        }

        defaultThinkingProcess.removeSupersededVersionEdges();

        return defaultThinkingProcess.edges, defaultThinkingProcess.nodes;
    }

    addReloadEdge(edge_id, edge_start, edge_end, edge_label) {
        const edgeId = String(edge_id || '');
        const isTriggerFrom = edgeId.indexOf('tf_') === 0;
        const isTriggerTo = edgeId.indexOf('tt_') === 0;
        const edge = {
            id: edge_id,
            from: edge_start,
            to: edge_end,
            label: edge_label,
            isDefaultVersionEdge: false
        };
        if(isTriggerFrom || isTriggerTo){
            edge.group = isTriggerFrom ? "trigger_from" : "trigger_to";
            edge.arrows = 'to';
            edge.smooth = false;
            edge.fixed = true;
        }
        this.edges.add(edge);
        this.removeSupersededVersionEdges();
    }

    //未完成　ノード追加
    addNewNode() {
        this.addNode(this.generateUniqueNumberText(), "newNode", "process", this.latest_selected_node_info.x, this.latest_selected_node_info.y);
    }

    //ノードのラベル編集(完了)
    editNode(node_id, node_content) {
        //ノードのラベルの編集
        const node = this.nodes.get(node_id);
        if (node) { // IDに相当するノードがある場合の中身を編集
            let result_label = '';
            for (let i = 0; i < node_content.length; i += 10) {
                result_label += node_content.substr(i, 10) + '\n';
            }
            result_label = result_label.trim(); // 末尾の不要な改行を除去
            node.label = result_label;
            // 編集を反映
            this.nodes.update(node);
            defaultRecordThinkingProcess.update_Node("label", node_id, node_content, "");
        }
    }

    showNetworkNotice(message) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        let notice = container.querySelector('.process-network-notice');
        if (!notice) {
            notice = document.createElement('div');
            notice.className = 'process-network-notice';
            notice.setAttribute('role', 'status');
            notice.setAttribute('aria-live', 'polite');
            container.appendChild(notice);
        }
        notice.textContent = message;
        notice.classList.remove('is-visible');
        void notice.offsetWidth;
        notice.classList.add('is-visible');

        if (this.networkNoticeTimer) clearTimeout(this.networkNoticeTimer);
        this.networkNoticeTimer = setTimeout(function() {
            notice.classList.remove('is-visible');
        }, 2500);
    }

    //ダブルクリック時編集(完了)
    doubleclick (params) {
        const clickedNodeId = params.nodes[0];
        if (clickedNodeId !== undefined) {
            const clickedNode = this.nodes.get(clickedNodeId);
            if (!clickedNode) return;
            if(clickedNode.group == "versionTime"){
                return;
            }
            if(this.containerId === "myProcessnetwork" && (clickedNode.group === "versions" || clickedNode.group === "versionsBro")){
                this.ownNetwork.setSelection({ nodes: [] });
                this.showNetworkNotice('バージョンノードは編集できません');
                return;
            }
            // ユーザーに新しいラベルを尋ね、それをノードの中身に設定
            const newLabel = prompt('新しいラベルを入力してください:', clickedNode.label.split('\n').join(''));
            // 編集したラベルを反映
            if (newLabel !== null) {
                this.editNode(clickedNodeId, newLabel);
            }
        }
    }

    // ノード削除(完了)
    deleteNode (){
        const selectNodeId = this.ownNetwork.getSelection().nodes[0];
        if(selectNodeId !== undefined){
            console.log(defaultThinkingProcess.nodes.get(selectNodeId));
            const node_group = defaultThinkingProcess.nodes.get(selectNodeId).group;
            console.log(node_group);
            if(node_group == "versionTime"){
                this.ownNetwork.setSelection({ nodes: [] });
                return;
            }
            if(node_group == "versions" || node_group == "versionsBro"){
                this.deleteNodeVersion(selectNodeId);
                return;
            }
            if(node_group == "trigger"){
                defaultRecordThinkingProcess.delete_trigger_Node(selectNodeId);
            }else{
                defaultRecordThinkingProcess.delete_db_Node(selectNodeId);
            }
            defaultRecordThinkingProcess.delete_db_Edge(null, selectNodeId, "");
            defaultRecordThinkingProcess.delete_db_Edge(null, "", selectNodeId);

            this.edges.remove(this.ownNetwork.getConnectedEdges(selectNodeId));
            this.nodes.remove({id: selectNodeId});
            // const ontology_index = this.OntologyConnectNodeId.indexOf(selectNodeId);
            // if(ontology_index !== -1){
            //     this.nodes.remove({ id: this.OntologyNodeId[ontology_index]});
            //     defaultRecordThinkingProcess.delete_db_Node(this.OntologyNodeId[ontology_index]);
            //     this.OntologyNodeId.splice(ontology_index, 1);
            //     this.OntologyConnectNodeId.splice(ontology_index, 1);
            // }
            // const connect_net_index = [];
            // this.ConnectNetworkNodeId.map((n_id, index) => {
            //     if(n_id === selectNodeId){
            //         connect_net_index.push(index);
            //     }
            // });
            // connect_net_index.sort((a, b) => b - a);
            // connect_net_index.forEach(index => {
            //     this.ConnectNetworkNodeId.splice(index, 1);
            //     this.ConnectMindMapNodeId.splice(index, 1);
            // });
            // defaultRecordThinkingProcess.delete_connection(selectNodeId);
        }
    }

    deleteNodeVersion(nodeVersionId){
        if(!confirm("選択したノードのバージョンを本当に削除していいですか？")){
            return;
        }

        $.ajax({
            url: "../php/delete_node_version.php",
            type: "POST",
            dataType: "json",
            data: {
                node_version_id: nodeVersionId
            }
        }).done((response) => {
            if(response && response.status === "ok"){
                const connectedEdges = this.ownNetwork.getConnectedEdges(nodeVersionId);
                const deletedNodeVersionId = String(nodeVersionId);
                const triggerFromRewireNodeVersionId = response.trigger_from_rewire_node_version_id || response.previous_node_version_id;
                const triggerToRewireNodeVersionId = response.trigger_to_rewire_node_version_id || response.next_node_version_id || response.previous_node_version_id;
                const processRewireNodeVersionId = response.process_rewire_node_version_id || response.next_node_version_id || response.previous_node_version_id;
                const edgesToRemove = [];
                const edgesToUpdate = [];

                connectedEdges.forEach((edgeId) => {
                    const edge = this.edges.get(edgeId);
                    if(!edge){
                        return;
                    }
                    if(edge.group === "versionEdges"){
                        edgesToRemove.push(edgeId);
                        return;
                    }

                    const updatedEdge = Object.assign({}, edge);
                    let rewireNodeVersionId = processRewireNodeVersionId;
                    if(edge.group === "trigger_from"){
                        rewireNodeVersionId = triggerFromRewireNodeVersionId;
                    }else if(edge.group === "trigger_to"){
                        rewireNodeVersionId = triggerToRewireNodeVersionId;
                    }

                    if(!rewireNodeVersionId){
                        edgesToRemove.push(edgeId);
                        return;
                    }
                    if(String(updatedEdge.from) === deletedNodeVersionId){
                        updatedEdge.from = rewireNodeVersionId;
                    }
                    if(String(updatedEdge.to) === deletedNodeVersionId){
                        updatedEdge.to = rewireNodeVersionId;
                    }
                    edgesToUpdate.push(updatedEdge);
                });

                if(edgesToUpdate.length > 0){
                    this.edges.update(edgesToUpdate);
                }
                if(edgesToRemove.length > 0){
                    this.edges.remove(edgesToRemove);
                }
                this.nodes.remove([{id: nodeVersionId}, {id: `${nodeVersionId}_appeared_at`}]);

                if(response.previous_node_version_id && response.next_node_version_id){
                    this.addVersionEdge(response.previous_node_version_id, response.next_node_version_id);
                }
            }else{
                alert((response && response.message) ? response.message : "ノードバージョンの削除に失敗しました");
            }
        }).fail((xhr) => {
            console.error("delete node version error:", xhr.responseText);
            alert("ノードバージョンの削除に失敗しました");
        });
    }

    // 右クリック時
    onContext(params) {
        this.nodeConnectEnabled = false;
        if (params.nodes.length == 1) {
            $('#jsmind_container').css('height','50%');
            const NetworkMenu = document.getElementById('t_Process_conmenu');
            this.selectId = params.nodes[0];
            const pointerX = params.pointer.DOM.x;
            const pointerY = params.pointer.DOM.y;
            const mynetPosition = document.getElementById("myProcessnetwork2").getBoundingClientRect();
            this.BoxDisplay.x = pointerX + mynetPosition.left + 20;
            this.BoxDisplay.y = pointerY + mynetPosition.top + 20;
            NetworkMenu.style.left = this.BoxDisplay.x;
            NetworkMenu.style.top = this.BoxDisplay.y;
            NetworkMenu.style.display = "block";//ここようわからん未完成かも
            if(this.OntologyConnectNodeId && this.OntologyConnectNodeId.indexOf(this.selectId) !== -1){
                document.getElementById("process_conmenu3").style.display = "block";
            }
        }
    }

    //ラベルの選択（完了）
    show_select (){
        document.getElementById('t_Process_conmenu').style.display = "none";
        if(this.OntologyConnectNodeId && this.OntologyConnectNodeId.indexOf(this.selectId) !== -1){
            alert('このノードにはすでに概念がつけられているため概念付けできません');
            return;
        }
        const labelselect = document.getElementById("labelselect");
        labelselect.style.display = "block";
        labelselect.style.left = this.BoxDisplay.x;
        labelselect.style.top = this.BoxDisplay.y;
    }

    openLessonAreaOpen(){
        // 1. コンテキストメニュー（t_Process_conmenu）と trigger_display を非表示
        const conmenu = document.getElementById('t_Process_conmenu');
        if (conmenu) conmenu.style.display = 'none';

        // 2. lesson_displayをオーバーレイタブとして表示
        showLessonDisplayOverlay();
        renderLessonForm();
        setLessonActionButton('組織へ共有', this.selectShareOrganization.bind(this));

        if (window.applyLessonDisplayLanguage) {
            window.applyLessonDisplayLanguage(window.currentLang || 'ja');
        }
    
    }

    closeLessonArea(){
        showTriggerDisplay();
    }

    async selectShareOrganization() {
        if (this.shareOrganizationLoading) return;
        const menu = document.getElementById('t_Process_conmenu');
        if (menu) menu.style.display = 'none';
        const nodeId = this.ownNetwork.getSelection().nodes[0];
        if (nodeId == null || !this.nodes.get(nodeId)) { alert('共有するノードを選択してください。'); return; }
        this.shareOrganizationLoading = true;
        try {
            const group = await window.ForestOkCoreSharing.chooseGroup();
            if (!group) return;
            if (this.ownNetwork.getSelection().nodes[0] !== nodeId) throw new Error('選択ノードが変わりました。共有するノードを選択し直してください。');
            const node = this.nodes.get(nodeId);
            if (!node) throw new Error('共有対象のノードがありません。選択し直してください。');
            await this.shareKnowledgeFragmentToOrganization(group.group_id, nodeId,
                String(node.label || '').replace(/\n+/g, ' ').trim());
        } catch (error) {
            alert(error.message || '保存結果を確認できません。再操作する前にKFと送信状態を確認してください。');
        } finally { this.shareOrganizationLoading = false; }
    }

    shareKnowledgeFragmentToOrganization(organizationId, nodeId, selected_contents = '') {
        // バリデーション
        if (!organizationId || !nodeId) {
            alert('共有する組織またはノードが選択されていません。');
            return;
        }



        // 学び(lesson)のテキストエリアを収集してサーバへ保存
        try {
            const lessonData = collectLessonFormData();
            const knowledge_fragment_title = lessonData.knowledge_fragment_title;
            const filteredContents = lessonData.contents;

            // ノード種類に関係なく共有：thought_experience_node_id に常に nodeId を送る。
            const node = defaultThinkingProcess.nodes.get(nodeId) || {};
            const nodeGroup = node.group || '';
            const postData = {
                purpose: "share_fragment",
                group_id: organizationId,
                experience_type: nodeGroup,
                thought_experience_node_id: nodeId,
                selected_contents: selected_contents || '',
                contents: JSON.stringify(filteredContents),
                knowledge_fragment_title: knowledge_fragment_title
            };
            if(nodeGroup === 'process'){
                postData.process_node_id = nodeId; // 互換性のため process_node_id も送る
            }



            // 送信
            return new Promise((resolve, reject) => $.ajax({
                url: "../php/thinking_edit_processmap_maneger.php",
                type: "POST",
                dataType: 'json',
                data: postData,
                success: function(resp) {
                    window.ForestOkCoreSharing.notify(resp);
                    resolve(resp);
                },
                error: function(xhr) {
                    reject(new Error(xhr.responseJSON && xhr.responseJSON.message
                        || '保存結果を確認できません。再操作する前にKFと送信状態を確認してください。'));
                }
            }));
        } catch (e) {
            return Promise.reject(e);
        }
    }

    ContentmenuCancel(){
        document.getElementById('t_Process_conmenu').style.display = "none";
    }

    //ノードがクリックされたときの処理
    networkClick (params){
        //他のところクリックしたら色直す
        if (document.getElementById("ontology_feedback")) document.getElementById("ontology_feedback").innerHTML = "";
        const feedbackarea = document.getElementsByClassName("accordion-item");
        for(var i=0; i<feedbackarea.length; i++){
            feedbackarea[i].style.display = "none";
        }
        if(this.jmindex != []){
            const jmnode = document.getElementsByTagName("jmnode");
            this.jmindex.map((n) => {
                if(jmnode[n].getAttribute("type") == "answer"){
                    jmnode[n].style.backgroundColor = "#ffffff";
                }else{
                    jmnode[n].style.backgroundColor = "#87cefa";
                }
            })
            this.jmindex.length = 0;
        }
        // if(this.RecruitNodeId.indexOf(params.nodes[0]) !== -1){
        //     this.FeedbackNodeId = params.nodes[0];
        //     document.getElementById(this.FeedbackNodeId).style.display = "block";
        // }
        // if(params.nodes.length == 1){
        //     const net_index = this.ConnectNetworkNodeId.map((n_id, index) => {
        //         return n_id === params.nodes[0] ? index : null;
        //     }).filter(n => n !== null);
        //     if(net_index == ""){
        //         return;
        //     }
        //     const jmnode = document.getElementsByTagName("jmnode");
        //     net_index.map((m_id) => {
        //         for(var i = 0; i < jmnode.length; i++){
        //             if(jmnode[i].getAttribute("nodeid") == this.ConnectMindMapNodeId[m_id]){
        //                 //ここいろかえる必要あるかも
        //                 jmnode[i].style.backgroundColor = "white";
        //                 this.jmindex.push(i);
        //                 break;
        //             }
        //         }
        //     });
        // }
    }

    addNewEdge(E_start, E_end){
        let edge_id = this.generateUniqueNumberText();
        this.edges.add({ id: edge_id, from: E_start, to: E_end, isDefaultVersionEdge: false });
        defaultRecordThinkingProcess.record_Edge(edge_id, E_start, E_end);
        this.removeSupersededVersionEdges();
    }

    //ドラッグ開始(完成)
    dragstart (params) {
        if(!this.edgeEditMode){
            params.event.preventDefault();
        }else{
            this.dragStartNodeId = this.ownNetwork.getNodeAt(params.pointer.DOM);
        }
    }

    //ドラッグ終了(完成)
    dragend (params) {
        if(this.edgeEditMode){
            this.dragEndNodeId = this.ownNetwork.getNodeAt(params.pointer.DOM);
            if(this.dragStartNodeId !== null && this.dragEndNodeId !== null && this.dragEndNodeId !== this.dragStartNodeId && this.dragEndNodeId !== undefined && this.nodes.get(this.dragStartNodeId).shape != "ellipse" && this.nodes.get(this.dragEndNodeId).shape != "ellipse"){
                let notable = true;
                const ConnectSelectNode = [];
                const connectedEdges = this.ownNetwork.getConnectedEdges(this.dragStartNodeId);
                connectedEdges.map((n)=>{
                    ConnectSelectNode.push(this.ownNetwork.getConnectedNodes(n).filter(n => n !== this.dragStartNodeId)[0]);
                });
                ConnectSelectNode.map((n)=>{
                    if(n === this.dragEndNodeId){
                        notable = false;
                    }
                });
                if(notable == false){
                    return;
                }
                let edge_id = this.generateUniqueNumberText();
                this.edges.add({id: edge_id, from: this.dragStartNodeId, to: this.dragEndNodeId, isDefaultVersionEdge: false });
                defaultRecordThinkingProcess.record_Edge(edge_id, this.dragStartNodeId, this.dragEndNodeId);
                this.removeSupersededVersionEdges();
            }
            this.dragStartNodeId = null;
            this.dragEndNodeId = null;
        }else{
            const movedNodeId = params.nodes[0];
            if (movedNodeId !== undefined) {
                if(this.nodes.get(movedNodeId).group == "versionTime"){
                    this.ownNetwork.setSelection({ nodes: [] });
                    return;
                }
                //なぜか更新したら色変わってしまうから一時的に
                let node_color = this.nodes.get(movedNodeId).color;
                // let border_color = '#ffdb4f'; 
                // switch(this.nodes.get(movedNodeId).group) {
                //     case "process": // 自分で考えた要約に関するノードの場合
                //         node_color = '#ffdb4f';
                //         break;
                //     case "versions": // 議論内での発言ノードの場合
                //         node_color = '#ffbaa1';
                //         break;
                //     case "topic-tag": // 議論内省マップのノードがどんなトピックに対応しているかを表すタグノードの場合
                //         node_color = '#ffdb4f';
                //         break;
                //     default: // その他
                //         break;
                // }
                this.nodes.update({ id: movedNodeId, color: node_color, x: params.pointer.x, y: params.pointer.y });
                const nodeBoundingBox = this.ownNetwork.getBoundingBox(movedNodeId);
                if(this.nodes.get(`${movedNodeId}_appeared_at`)){
                    this.nodes.update({
                        id: `${movedNodeId}_appeared_at`,
                        x: (nodeBoundingBox.right + nodeBoundingBox.left)/2,
                        y: nodeBoundingBox.bottom + 20
                    });
                }
                //次に追加したノードの座標指定
                this.latest_selected_node_info.x = (nodeBoundingBox.right + nodeBoundingBox.left)/2;
                this.latest_selected_node_info.y = nodeBoundingBox.bottom + 10;
                
                if(this.nodes.get(movedNodeId).group == "trigger"){
                    defaultRecordThinkingProcess.update_trigger_point(movedNodeId, (nodeBoundingBox.right + nodeBoundingBox.left)/2, (nodeBoundingBox.bottom + nodeBoundingBox.top)/2);
                }else{
                    defaultRecordThinkingProcess.update_Node("point" ,movedNodeId, (nodeBoundingBox.right + nodeBoundingBox.left)/2, (nodeBoundingBox.bottom + nodeBoundingBox.top)/2)
                }
                // const ontology_index = this.OntologyConnectNodeId.indexOf(movedNodeId);
                // if(ontology_index !== -1){
                //     const nodeBoundingBox = this.ownNetwork.getBoundingBox(movedNodeId);
                //     const ontology_x = nodeBoundingBox.left;
                //     const ontology_y = nodeBoundingBox.top;
                //     console.log(this.Recruit[this.RecruitNodeId.indexOf(this.OntologyConnectNodeId[this.OntologyNodeId.indexOf(this.OntologyNodeId[ontology_index])])]);
                //     if(this.Recruit[this.RecruitNodeId.indexOf(this.OntologyConnectNodeId[this.OntologyNodeId.indexOf(this.OntologyNodeId[ontology_index])])]==="採用"){
                //         border_color = 'green'; 
                //     }else if(this.Recruit[this.RecruitNodeId.indexOf(this.OntologyConnectNodeId[this.OntologyNodeId.indexOf(this.OntologyNodeId[ontology_index])])]==="棄却"){
                //         border_color = 'red'; 
                //     }
                //     this.nodes.update({ id: this.OntologyNodeId[ontology_index], color: { background: 'blue', border: border_color}, x: ontology_x, y: ontology_y });
                //     defaultRecordThinkingProcess.update_Node("point" ,this.OntologyNodeId[ontology_index], ontology_x, ontology_y);
                // }
            }
        }
    }
    
    // エッジの削除（完了）
    deleteEdge() {
        const selectEdgeId = this.ownNetwork.getSelection().edges[0];
        const selectedEdge = selectEdgeId !== undefined ? this.edges.get(selectEdgeId) : null;
        if(selectedEdge){
            const startid = selectedEdge.from;
            const endid = selectedEdge.to;
            defaultRecordThinkingProcess.delete_db_Edge(selectEdgeId, startid, endid).done(() => {
                this.edges.remove({id: selectEdgeId});
            });
            // const Edge_index = this.OntologyConnectNodeId.indexOf(startid);
            // if(Edge_index !== -1){
            //     this.EdgeStartId.splice(Edge_index, 1);
            //     this.EdgeEndId.splice(Edge_index, 1);
            // }
        }
    }

    // Nodeblinking() {
    //     this.Feedback.map((n) => {
    //         const feedbacknode = this.nodes.get(n);
    //         let node_color = '#ffdb4f'; // ノードの背景色
    //         switch(feedbacknode.group) {
    //             case "material-content": // 議論資料に書かれた内容に関するノードの場合
    //                 break;
    //             case "process": // 自分で考えた要約に関するノードの場合
    //                 node_color = 'green';
    //                 break;
    //             case "utterance": // 議論内での発言ノードの場合
    //                 node_color = 'pink';
    //                 break;
    //             case "topic-tag": // 議論内省マップのノードがどんなトピックに対応しているかを表すタグノードの場合
    //                 node_color = 'blue';
    //                 break;
    //             default: // その他
    //                 break;
    //         }
    //         const borderWidth = feedbacknode.borderWidth === 0 ? 5 : 0;
    //         this.nodes.update({ id: n, color: { background: node_color, border: "red"}, borderWidth: borderWidth });
    //     })
    // }

    addMaterialOntology(material_id, concept_id){
        $.ajax({
            url:'js/hozo.xml',
            type:'get',
            dataType:'xml',
            timeout:1000,
            success: (xml,status) => {
                if(status!='success')return;
                const XML = $(xml).find('W_CONCEPTS');
                const concept = Array.from(XML[0].getElementsByTagName('CONCEPT'));
                //hozo.xmlファイルのタグを検索して変数に格納（たぶん，全てのタグが配列で格納されている），thisはhozo.xmlのことかな
                concept.map((content)=>{
                    if(content.getAttribute('id') === concept_id){
                        const slot_content = Array.from(content.getElementsByTagName("SLOT"));
                        slot_content.map((content_slot) => {
                            if(content_slot.getAttribute("role") === "出力"){
                                const nodeBoundingBox = defaultThinkingProcess.ownNetwork.getBoundingBox(material_id);
                                this.addNode(concept_id, content_slot.getAttribute("class_constraint"), "topic-tag", nodeBoundingBox.left, nodeBoundingBox.top);
                                this.OntologyConnectNodeId.push(material_id);
                                this.OntologyNodeId.push('topic-tag_'+concept_id);
                                defaultRecordThinkingProcess.record_ontology(material_id, 'topic-tag_'+concept_id);
                            }
                        });
                    }
                });
            }
        });
    }

    zoomIn() {
        const scale = this.ownNetwork.getScale() * 1.1; // Increase scale by 10%
        this.scale = scale;
        this.ownNetwork.moveTo({ scale: scale });
    }
      
    zoomOut() {
        const scale = this.ownNetwork.getScale() * 0.9; // Decrease scale by 10%
        this.scale = scale;
        this.ownNetwork.moveTo({ scale: scale });
    }

}

// ネットワーク関係の記録
class RecordThinkingProcess{
    //ノードの記録(完了)
    record_Node (id, label, node_type, x, y){
        let selected_node_id = document.getElementById('conceptdisplay').getAttribute('nodeId');
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {node_id : id,
                label : label,
                node_type: node_type,
                x : x,
                y : y,
                selected_node_id: selected_node_id,
                purpose : 'record',
                record_thing: 'node'},
        });
    }

    //エッジの記録(完了)
    record_Edge (edge_id, edge_start, edge_end){
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {edge_id: edge_id,
                edge_start : edge_start,
                edge_end : edge_end,
                purpose : 'record',
                record_thing: 'edge'},
        });
    }

    //ノードの更新(完了)
    update_Node (select_update, id, node_update_thing1, node_update_thing2){
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {select_update : select_update,
                node_id : id,
                purpose : 'update',
                update_thing : 'node',
                node_update_thing1 : node_update_thing1,
                node_update_thing2: node_update_thing2},
            success:function(e){
                if(e){
                    console.log(e);
                }
            }
        });
    }

    //ノードの削除(完了)
    update_trigger_point (trigger_id, x, y){
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {
                trigger_id : trigger_id,
                x : x,
                y : y,
                purpose : 'update',
                update_thing : 'trigger_point'
            },
            success:function(e){
                if(e){
                    console.log(e);
                }
            },
            error: function(xhr, status, error){
                console.error("trigger point update failed", status, error, xhr.responseText);
            }
        });
    }

    delete_db_Node (id){
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {node_id : id,
                purpose : 'delete',
                delete_thing : 'node'},
        });
    }

    //triggerの削除
    delete_trigger_Node (id){
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {trigger_id : id,
                purpose : 'delete',
                delete_thing : 'trigger'},
            success: function(e){
                if(e){
                    console.log(e);
                }
            }
        });
    }
    
    //エッジの削除(完了)
    delete_db_Edge (edge_id, edge_start,edge_end){
        return $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {edge_id: edge_id,
                edge_start : edge_start,
                edge_end : edge_end,
                purpose : 'delete',
                delete_thing : 'edge'},
                success: function(e){
                    if(e){
                        console.log(e);
                    }
                },
                error: function(xhr, status, error){
                    console.error("edge delete failed", status, error, xhr.responseText);
                }
        });
    }

    // delete_connection (id){
    //     $.ajax({
    //         url: "../php/thinking_edit_processmap_maneger.php",
    //         type: "POST",
    //         data: {node_id : id,
    //             purpose : 'delete',
    //             delete_thing : 'connection'},
    //     });
    // }

    // //繋げたものをDBに記録
    // record_connection (NetworkNodeId,MindMapNodeId){
    //     $.ajax({
    //         url: "../php/thinking_edit_processmap_maneger.php",
    //         type: "POST",
    //         data: {networknodeid : NetworkNodeId,
    //             mindmapnodeid : MindMapNodeId,
    //             purpose : 'record',
    //             record_thing : 'connection'},
    //     });
    // }

    // // オントロジーの対応付けの記録
    // record_ontology (node_id, ontology_node_id){
    //     $.ajax({
    //         url: "../php/thinking_edit_processmap_maneger.php",
    //         type: "POST",
    //         data: {node_id : node_id,
    //             ontology_node_id : ontology_node_id,
    //             purpose : 'record',
    //             record_thing : 'ontology'},
    //     });
    // }

    // // オントロジーの対応付けの記録
    // record_recruit (node_id, ontology_node, result){
    //     $.ajax({
    //         url: "../php/thinking_edit_processmap_maneger.php",
    //         type: "POST",
    //         data: {node_id : node_id,
    //             ontology_node : ontology_node,
    //             result_recruit : result,
    //             purpose : 'record',
    //             record_thing : 'recruit'},
    //     });
    // }

    record_trigger(trigger_id, activity_id, node_id, from, to, time, activity_type, content, x, y){
        if(!node_id){
            console.error("trigger record failed: the open thinking-process node_id is unavailable");
            return;
        }
        
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {trigger_id : trigger_id,
                activity_id : activity_id,
                node_id : node_id,
                from : from,
                to : to,
                activity_time : time,
                activity_type : activity_type,
                content : content,
                x : x,
                y : y,
                purpose: 'record',
                record_thing : 'trigger'},
            success: function(e){
                if(e){
                    console.log(e);
                }else{
                    if(activity_id){
                        document.getElementById(activity_id).trigger_on = 1;
                        document.getElementById(activity_id).style.background = "#979997";
                        document.getElementById(activity_id).style.borderWidth = 3;
                    }
                }
            },
            error: function(xhr, status, error){
                console.error("trigger record failed", status, error, xhr.responseText);
            }
        });
    }
}

// myOrganizationalnetwork 内で右クリックしたときにブラウザ既定のコンテキストメニューを抑制
document.addEventListener('DOMContentLoaded', function(){
    const orgEl = document.getElementById('myOrganizationalnetwork');
    if(orgEl){
        orgEl.addEventListener('contextmenu', function(e){
            e.preventDefault();
        });
    }
});


/*
 * データベースからの読み込み
 */
let process_mode; // 思考過程表出化マップの表示モードを保持する変数
let trigger_list;   // データベースから取得した思考過程表出化マップの情報を保持する変数
let selected_concept_id;  // 選択されている概念IDを保持する変数
let selected_other_process_id; // 他者の思考過程表出化マップを表示する際に使用する変数
let selected_other_process_group; // 他者ノードのgroupを保持する変数
// ガード用タイムスタンプ（同一操作による二重実行を抑止）
let _lastShowThinkingProcessCall = 0;

const getOpenThinkingProcessNodeId = () => {
    const conceptDisplay = document.getElementById("conceptdisplay");
    const displayedNodeId = conceptDisplay ? conceptDisplay.getAttribute("nodeid") : "";
    if(displayedNodeId){
        return displayedNodeId;
    }
    if((process_mode === "all" || process_mode === "allRE") && typeof _jm !== "undefined" && _jm.get_selected_node){
        const selectedNode = _jm.get_selected_node();
        return selectedNode && selectedNode.id ? selectedNode.id : "";
    }
    return "";
};

const getProcessMapDataFromDB = (callback) => {
    //選択されているノードIDとconcept_id
    let selected_node_id = null;
    let selected_node_group = '';
    if(process_mode == "all"){
        selected_node_id = _jm.get_selected_node().id;
        selected_concept_id = Get_NodeInfo(selected_node_id, "concept_id");

        // 保存用にconceptdisplayの属性を更新
        const conceptDisplay = document.getElementById("conceptdisplay");
        conceptDisplay.setAttribute('conceptid', selected_concept_id);
        conceptDisplay.setAttribute('nodeid', selected_node_id);
    }else if(process_mode == "who"){
        selected_node_id = selected_other_process_id;    //選択した他者のprocessノードIDを格納
        selected_node_group = selected_other_process_group;
    }else{
        const conceptDiplay = document.getElementById("conceptdisplay");
        selected_node_id = conceptDiplay.getAttribute('nodeid');
        selected_concept_id = conceptDiplay.getAttribute('conceptid');;
    }
    
    choose_trigger_xmlLoad().then(conceptIds => {
        return new Promise((resolve, reject) => {
            try{
                return $.ajax({
                    url: "../php/thinking_map_manager.php",
                    type: "POST",
                    data: data =  {
                        process_mode: process_mode,
                        selected_node_id: selected_node_id,
                        selected_node_group: selected_node_group,
                        selected_concept_id: selected_concept_id,
                        concept_ids: conceptIds
                    },
                }).success((r) => {
                    trigger_list = JSON.parse(r);
                    console.log(trigger_list);
                    callback(trigger_list);
                });
            } catch (error){
                reject(error);
            }
        });
    }).catch(error => {
        console.error(error); // エラー処理
    });
}

const makeTriggerInList = (id, activity_type, concept_label, content, timestamp, trigger_on, candidate_category) => {
    // 左側の発話ノードのリストのところのノードのDOMを構成する
    let backColor = "white";
    let borderColor = "#67796b";
    let borderWidth = 1;
    const category = candidate_category || 'related_concept';
    if(trigger_on == 1){
        backColor = "#979997";
        borderWidth = 2;
    }
    const item = $('<div></div>').attr({
        id: id, trigger_content: content, timestamp: timestamp,
        trigger_on: trigger_on, activity_type: activity_type,
        'data-trigger-category': category
    }).addClass('trigger_in_list').css({border: borderWidth + 'px solid ' + borderColor, background: backColor});
    const header = $('<div></div>').append(document.createTextNode('【' + timestamp + '：'));
    header.append($('<span></span>').attr('data-trigger-system-text', activity_type).text(translateThinkingProcessText(activity_type)));
    header.append(document.createTextNode('】'));
    item.append(header);
    const concept = $('<span></span>').attr('data-trigger-concept-label', concept_label || '').text(translateThinkingProcessConceptLabel(concept_label));
    item.append($('<div></div>').append(concept).append(document.createTextNode('：')));
    item.append($('<div class="trigger-candidate-content"></div>').text(content));
    return item;
}

const renderTriggerCandidateList = (target_area, candidates) => {
    const safeCandidates = Array.isArray(candidates) ? candidates : [];
    target_area.empty();

    const filterArea = $(`
        <div class="trigger-candidate-filter">
            <button type="button" class="trigger-candidate-filter-btn is-active" data-trigger-filter="all">All</button>
            <button type="button" class="trigger-candidate-filter-btn" data-trigger-filter="parent_node" data-trigger-system-text="親ノード関連">${translateThinkingProcessText("親ノード関連")}</button>
            <button type="button" class="trigger-candidate-filter-btn" data-trigger-filter="related_concept" data-trigger-system-text="関連する観点">${translateThinkingProcessText("関連する観点")}</button>
        </div>
    `);
    const listSection = $('<div class="trigger-candidate-section"><div class="trigger-candidate-items"></div></div>');

    target_area.append(filterArea);
    target_area.append(listSection);

    const sortedCandidates = safeCandidates.slice().sort((a, b) => {
        const at = a && a.appeared_at ? String(a.appeared_at) : '';
        const bt = b && b.appeared_at ? String(b.appeared_at) : '';
        return bt.localeCompare(at);
    });

    const renderItems = (filter) => {
        const itemsArea = listSection.find('.trigger-candidate-items');
        itemsArea.empty();
        sortedCandidates.forEach((u) => {
            if(!u){ return; }
            const category = u.candidate_category === 'parent_node' ? 'parent_node' : 'related_concept';
            if(filter !== 'all' && filter !== category){ return; }
            const trigger_dom = makeTriggerInList(u.activity_id, u.activity_type, u.concept_label, u.content, u.appeared_at, u.trigger_on, category);
            itemsArea.append(trigger_dom);
        });
        if(itemsArea.find('.trigger_in_list').length === 0){
            itemsArea.append($('<div class="trigger-candidate-empty" data-trigger-system-text="候補はありません"></div>').text(translateThinkingProcessText('候補はありません')));
        }
    };

    renderItems('all');
    applyThinkingProcessDisplayLanguage();

    target_area.find('.trigger-candidate-filter-btn').on('click', function(){
        const filter = $(this).attr('data-trigger-filter') || 'all';
        target_area.find('.trigger-candidate-filter-btn').removeClass('is-active');
        $(this).addClass('is-active');
        renderItems(filter);
        addeventdisplayTriggerData();
    });
}

// 思考過程表出化マップを表示
const getEmptyInitialVersionIds = (nodeVersions) => {
    const earliestByNode = {};
    (Array.isArray(nodeVersions) ? nodeVersions : []).forEach((version) => {
        if(!version || !version.node_version_id) return;
        const nodeKey = version.node_id ? String(version.node_id) : '__selected_node__';
        const current = earliestByNode[nodeKey];
        const appearedAt = String(version.appeared_at || '');
        if(!current || appearedAt < String(current.appeared_at || '')){
            earliestByNode[nodeKey] = version;
        }
    });

    const emptyIds = {};
    Object.keys(earliestByNode).forEach((nodeKey) => {
        const version = earliestByNode[nodeKey];
        if(String(version.content || '').trim() === 'New Node'){
            emptyIds[String(version.node_version_id)] = true;
        }
    });
    return emptyIds;
};

const renderReloadTriggerNodes = (triggerRows) => {
    let pending = (Array.isArray(triggerRows) ? triggerRows : []).filter(Boolean);
    let madeProgress = true;

    while(pending.length > 0 && madeProgress){
        madeProgress = false;
        const unresolved = [];

        pending.forEach((trigger) => {
            const fromNode = trigger.node_version_from;
            const toNode = trigger.node_version_to;
            if(!defaultThinkingProcess.nodes.get(fromNode) || !defaultThinkingProcess.nodes.get(toNode)){
                unresolved.push(trigger);
                return;
            }

            const connectedEdges = defaultThinkingProcess.ownNetwork.getConnectedEdges(fromNode) || [];
            let edgeId = null;
            for(let i = 0; i < connectedEdges.length; i++){
                const edge = defaultThinkingProcess.edges.get(connectedEdges[i]);
                if(edge && String(edge.from) === String(fromNode) && String(edge.to) === String(toNode)){
                    edgeId = edge.id;
                    break;
                }
            }

            defaultThinkingProcess.addTriggerNode(
                "Reload",
                trigger.trigger_id,
                edgeId,
                fromNode,
                toNode,
                trigger.activity_id,
                trigger.content,
                trigger.activity_type,
                trigger.activity_time,
                trigger.x,
                trigger.y
            );
            madeProgress = true;
        });

        pending = unresolved;
    }

    if(pending.length > 0){
        console.warn('Some triggers could not be rendered because their connected nodes were not loaded.', pending);
    }
};

const displayTriggerData = (mode, process_display_option) => {
    process_mode = mode;
    let node_x = 0;
    let node_y = 0;
    let from_id = "";
    if(mode=="all" || mode == "allRE"){
        const conceptdisplay_area = $(`#conceptdisplay`); // 何の認知活動かを表示するエリア
        const target_area = $(`#${process_display_option}`); // DOMエリア
        $('#trigger_candidate_list').html("");

        getProcessMapDataFromDB ((trigger_list_info) => {
            //concept_labelを表示
            const concept_label = trigger_list_info['selected_concept'];
            conceptdisplay_area.empty().append($('<span></span>').attr('data-trigger-concept-label', concept_label || '').text(translateThinkingProcessConceptLabel(concept_label)));
            let j = 0;
            const emptyInitialVersionIds = getEmptyInitialVersionIds(trigger_list_info.node_versions);

            // versionノードの表示
            trigger_list_info.node_versions.forEach((v) => {
                defaultThinkingProcess.addVersionNode(v.node_version_id, v.content, "versions", v.appeared_at, node_x, node_y, !!emptyInitialVersionIds[String(v.node_version_id)]);
                if(from_id != ""){
                    defaultThinkingProcess.addVersionEdge(from_id, v.node_version_id);
                }
                from_id = v.node_version_id;
                node_x += 300;
            });
            // triggerの候補一覧
            renderTriggerCandidateList(target_area, trigger_list_info.trigger_candidate);
            trigger_list_info.pnode.map((n) => {
                defaultThinkingProcess.addReloadNode(n.process_node_id, n.content, n.process_node_type, n.node_x, n.node_y);
            });
            trigger_list_info.pedge.map((n) => {
                defaultThinkingProcess.addReloadEdge(n.process_edge_id, n.edge_start, n.edge_end, n.label);
            });
            renderReloadTriggerNodes(trigger_list_info.trigger);
            const nodes = this.nodes;
            const edges = this.edges;

            addeventdisplayTriggerData();
            
        });
    }else if(mode=="AddBrother"){
        getProcessMapDataFromDB ((trigger_list_info) => {
            // versionノードの表示
            let bronum = trigger_list_info.brother_num;
            const emptyInitialVersionIds = getEmptyInitialVersionIds(trigger_list_info.node_versions);
            trigger_list_info.node_versions.forEach((v) => {
                console.log(bronum[v.node_id]);
                if(v.broversion){
                    node_x = defaultThinkingProcess.nodes.get(v.broversion).x;
                    node_y = v.y;
                }else{
                    node_x -= 150
                }
                if(!v.y || v.y == '233px'){
                    node_y = 100;
                }
                console.log(node_y);
                // versionノードで時間軸が同じになるようにx座標を合わせる
                defaultThinkingProcess.addVersionNode(v.node_version_id, v.content, "versionsBro", v.appeared_at, node_x, node_y, !!emptyInitialVersionIds[String(v.node_version_id)]);
                if(from_id != ""){
                    defaultThinkingProcess.addVersionEdge(from_id, v.node_version_id);
                }
                from_id = v.node_version_id;
                node_x += 150;
            });
            trigger_list_info.pnode.map((n) => {
                defaultThinkingProcess.addReloadNode(n.process_node_id, n.content, n.process_node_type, n.node_x, n.node_y);
            });
            trigger_list_info.pedge.map((n) => {
                defaultThinkingProcess.addReloadEdge(n.process_edge_id, n.edge_start, n.edge_end, n.label);
            });
            renderReloadTriggerNodes(trigger_list_info.trigger);

            const nodes = this.nodes;
            const edges = this.edges;
        })

    }else if(mode=="who"){
        const conceptdisplay_area = $(`#others_conceptdisplay`); // 何の認知活動かを表示するエリア
        const others_node = process_display_option; // 選択されているノード
        if(others_node.group === "versions" || others_node.group === "versionsBro"){
            selected_other_process_group = "version";
        }else if(others_node.group === "triggers"){
            selected_other_process_group = "trigger";
        }else{
            selected_other_process_group = others_node.group || "process";
        }
        if(selected_other_process_group === "process" && others_node.process_node_id){
            selected_other_process_id = others_node.process_node_id;
        }else if(selected_other_process_group === "version" && others_node.node_version_id){
            selected_other_process_id = others_node.node_version_id;
        }else if(selected_other_process_group === "trigger" && others_node.trigger_id){
            selected_other_process_id = others_node.trigger_id;
        }else if(others_node.thought_experience_node_id){
            selected_other_process_id = others_node.thought_experience_node_id;
        }else{
            selected_other_process_id = others_node.id;
        }
        selected_concept_id = others_node.concept_id;
        organizational_selected_user_id = others_node.user_id;
        console.log(selected_other_process_group);

        getProcessMapDataFromDB ((trigger_list_info) => {
            //concept_labelを表示
            const concept_label = trigger_list_info['selected_concept'];
            console.log(concept_label);
            conceptdisplay_area.empty()
                .append($('<span></span>').attr('data-trigger-concept-label', concept_label || '').text(translateThinkingProcessConceptLabel(concept_label)))
                .append($('<span></span>').attr('data-trigger-system-text', 'の思考過程').text(translateThinkingProcessText('の思考過程')));
            let j = 0;

            // versionノードの表示
            trigger_list_info.node_versions.forEach((v) => {
                defaultThinkingProcess.addVersionNode(v.node_version_id, v.content, "versions", v.appeared_at, node_x, node_y);
                if(from_id != ""){
                    defaultThinkingProcess.addVersionEdge(from_id, v.node_version_id);
                }
                from_id = v.node_version_id;
                node_x += 300;
            });
            trigger_list_info.pnode.map((n) => {
                defaultThinkingProcess.addReloadNode(n.process_node_id, n.content, n.process_node_type, n.node_x, n.node_y);
            });
            trigger_list_info.pedge.map((n) => {
                defaultThinkingProcess.addReloadEdge(n.process_edge_id, n.edge_start, n.edge_end, n.label);
            });
            renderReloadTriggerNodes(trigger_list_info.trigger);

            const nodes = this.nodes;
            const edges = this.edges;

            addeventdisplayTriggerData();
            
        });
    }
    
}

const addeventdisplayTriggerData = () => {
    let mousedownId = null;
    const accordionHeaders = document.querySelectorAll('#accordion_discussion .accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function () {
            const accordionItem = this.parentElement;
            accordionItem.classList.toggle('active');
        });
    });
    const feedbackarea = document.getElementsByClassName("accordion-item");
    for(var i=0; i<feedbackarea.length; i++){
        feedbackarea[i].style.display = "none";
    }
    $(`#lesson_area`).on('mousedown', (e) => {
    // リスト内の発話ノードにマウスイベント（マウスが要素上からでた）を追加
    mousedownId = null;
    const overed_node = e.target;
    if(overed_node.getAttribute('trigger_on')==='0'){
        mousedownId = overed_node.getAttribute('id');
    }
    });
    $(`#lesson_area`).on('mouseleave', (e) => {
    // リスト内の発話ノードにマウスイベント（マウスが要素上からでた）を追加
        // $(`#trigger_click`).empty();
    });
    $(`.trigger_in_list`).on('click', (e) => {
        // リスト内の発話ノードにマウスイベント(左クリック)を追加
        const clicked_trigger = e.currentTarget;
        document.getElementById("trigger_click").innerHTML="<input type='button' class='triggerbutton' id='triggerFromList' value='ノードとして追加'>";
        if (window.applyTriggerAreaLanguage) window.applyTriggerAreaLanguage(window.currentLang || 'ja');
        $(`#triggerFromList`).on("click", () => {
            const triggerData = {
                activity_id: clicked_trigger.getAttribute('id'),
                activity_type: clicked_trigger.getAttribute('activity_type'),
                timestamp: clicked_trigger.getAttribute('timestamp'),
                content: clicked_trigger.getAttribute('trigger_content')
            };
            inputTrigger(triggerData);
            document.getElementById("trigger_click").innerHTML="";
        });
    });
    $(`.trigger_in_list`).on('contextmenu', (e) => {
        // リスト内の発話ノードにマウスイベント(右クリック)を追加
        const clicked_trigger = e.target;
        document.getElementById("trigger_click").innerHTML="<input type='button' class='triggerbutton' id='triggerMapShow' value='マインドマップを表示'>";
        if (window.applyTriggerAreaLanguage) window.applyTriggerAreaLanguage(window.currentLang || 'ja');
        $(`#triggerMapShow`).on("click", () => {
            console.log(clicked_node.getAttribute('id'));
            document.getElementById("trigger_click").innerHTML="";
        });
    });
}

// 学習者がオリジナルのTriggerを入力できる箇所を作成
function inputTriggerAreaOpen(){
    $('#trigger_display').css('height','auto');
    $('#area_trigger_add').css('height','auto');
    $('#trigger_add').css('height','auto');
    document.getElementById('inputTriggerbutton').value = " × 閉じる";
    document.getElementById('inputTriggerbutton').onclick = inputTriggerAreaClose;

    // 日時入力欄
    let input_time = document.createElement('input');
    input_time.type = 'datetime-local';
    input_time.id = 'trigger_time';
    document.getElementById("trigger_add").appendChild(input_time);

    // 活動入力欄
    let input_activity = document.createElement('select');
    input_activity.id = 'trigger_activity';
    document.getElementById("trigger_add").appendChild(input_activity);

    // 活動一覧
    let s0 = document.createElement('option');
    s0.value = '';
    s0.textContent = '-何の活動を行いましたか？-';
    let s1 = document.createElement('option');
    s1.value = '自己内対話'
    s1.textContent = '自己内対話'
    let s2 = document.createElement('option');
    s2.value = '議論資料作成'
    s2.textContent = '議論資料作成'
    let s3 = document.createElement('option');
    s3.value = '議論内省'
    s3.textContent = '議論内省'
    let s4 = document.createElement('option');
    s4.value = '論文執筆'
    s4.textContent = '論文執筆'
    let s5 = document.createElement('option');
    s5.value = '論文読解'
    s5.textContent = '論文読解'
    document.getElementById("trigger_activity").appendChild(s0);
    document.getElementById("trigger_activity").appendChild(s1);
    document.getElementById("trigger_activity").appendChild(s2);
    document.getElementById("trigger_activity").appendChild(s3);
    document.getElementById("trigger_activity").appendChild(s4);
    document.getElementById("trigger_activity").appendChild(s5);

    // 自由記述欄
    let input_content = document.createElement('textarea');
    input_content.id = 'trigger_content';
    input_content.placeholder = '何をきっかけに思考が変化しましたか？';
    input_content.rows = 3
    document.getElementById("trigger_add").appendChild(input_content);
    
    // 入力ボタン 
    let input_button = document.createElement('input');
    input_button.type = 'button';
    input_button.className = 'triggerbutton';
    input_button.id = 'triggerNew'
    input_button.value = 'ノードとして追加';
    input_button.onclick = inputTrigger;
    document.getElementById("trigger_add").appendChild(input_button);
    if (window.applyTriggerAreaLanguage) window.applyTriggerAreaLanguage(window.currentLang || 'ja');
    
  }

//   Trigger入力箇所を閉じる処理
function inputTriggerAreaClose(){
    $('#trigger_display').css('height','100px');
    $('#area_trigger_add').css('height','auto');
    $('#trigger_add').css('height','0px');
    document.getElementById("trigger_time").remove();
    document.getElementById("trigger_activity").remove();
    document.getElementById("trigger_content").remove();
    document.getElementById("triggerNew").remove();
    document.getElementById('inputTriggerbutton').value = "＋ 活動を入力";
    document.getElementById('inputTriggerbutton').onclick = inputTriggerAreaOpen;
    if (window.applyTriggerAreaLanguage) window.applyTriggerAreaLanguage(window.currentLang || 'ja');
}

// 入力されたTriggerをマップに表示
function inputTrigger(triggerData){
    let trigger_id = defaultThinkingProcess.generateUniqueNumberText();
    const hasCustomData = triggerData && typeof triggerData === 'object' && Object.prototype.hasOwnProperty.call(triggerData, 'activity_type');
    const t_type = hasCustomData ? triggerData.activity_type : document.getElementById("trigger_activity").value;
    const t_time = hasCustomData ? triggerData.timestamp : document.getElementById("trigger_time").value.replace('T', ' ');
    let content = hasCustomData ? triggerData.content : document.getElementById("trigger_content").value;
    const activity_id = hasCustomData ? triggerData.activity_id : null;
    const t_label = "【"+t_time+"："+t_type+"】<br>"+content+"";
    
    if(!t_type){
        alert(translateThinkingProcessText('どの活動を行ったのか入力してください'));
        return;
    }else if(!content){
        alert(translateThinkingProcessText('どのような活動を行ったのか入力してください'));
        return;
    }

    const selected_node_ids = defaultThinkingProcess.ownNetwork.getSelection().nodes;
    const selected_node_id = selected_node_ids[0];
    const selected_edge_id = defaultThinkingProcess.ownNetwork.getSelection().edges;
    let edge_id =selected_edge_id;
    let num = 0 ;
    let selected_node_group = selected_node_id ? defaultThinkingProcess.nodes.get(selected_node_id).group : "";

    if(selected_edge_id.length == 1){
        const selectedEdge = defaultThinkingProcess.edges.get(selected_edge_id[0]);
        const connect_node_ids = defaultThinkingProcess.ownNetwork.getConnectedNodes(selected_edge_id[0]);
        let from_node = connect_node_ids[0];
        let to_node = connect_node_ids[1];
        if(!from_node || !to_node){
            alert(translateThinkingProcessText('triggerを追加するedgeを選択してください'));
            return;
        }
        const fromNode = defaultThinkingProcess.nodes.get(from_node);
        const toNode = defaultThinkingProcess.nodes.get(to_node);
        const trigger_x = (fromNode && toNode && Number.isFinite(fromNode.x) && Number.isFinite(toNode.x)) ? (fromNode.x + toNode.x) / 2 : null;
        const trigger_y = (fromNode && toNode && Number.isFinite(fromNode.y) && Number.isFinite(toNode.y)) ? (fromNode.y + toNode.y) / 2 : null;
        defaultThinkingProcess.edges.remove({id: selected_edge_id[0]});
        if(selectedEdge && selectedEdge.group !== "versionEdges" && selectedEdge.group !== "trigger_from" && selectedEdge.group !== "trigger_to"){
            defaultRecordThinkingProcess.delete_db_Edge(selected_edge_id[0], from_node, to_node);
        }
        defaultThinkingProcess.addTriggerNode("New", trigger_id, null, from_node, to_node, activity_id, t_label, t_type, t_time, trigger_x, trigger_y);
        return;
    }

    if(selected_node_ids.length >= 2){
        const from_node = selected_node_ids[0];
        const to_node = selected_node_ids[1];
        if(defaultThinkingProcess.nodes.get(from_node).group == "versionTime" || defaultThinkingProcess.nodes.get(to_node).group == "versionTime"){
            alert(translateThinkingProcessText('時刻表示以外のノードを選択してください'));
            return;
        }
        const fromNode = defaultThinkingProcess.nodes.get(from_node);
        const toNode = defaultThinkingProcess.nodes.get(to_node);
        const trigger_x = (fromNode && toNode && Number.isFinite(fromNode.x) && Number.isFinite(toNode.x)) ? (fromNode.x + toNode.x) / 2 : null;
        const trigger_y = (fromNode && toNode && Number.isFinite(fromNode.y) && Number.isFinite(toNode.y)) ? (fromNode.y + toNode.y) / 2 : null;
        defaultThinkingProcess.addTriggerNode("New", trigger_id, null, from_node, to_node, activity_id, t_label, t_type, t_time, trigger_x, trigger_y);
        return;
    }

    if(selected_node_id && selected_node_group == "versions" || selected_node_group == "versionsBro"){ 
        //versionのノードが選択されている時，それにつながるedge_idを取得し，右側のedge_idにつながるnode_idを取得する
        for(i = 0; i<selected_edge_id.length; i++){
            let selected_edge_group = defaultThinkingProcess.edges.get(selected_edge_id[i]).group
            if(selected_edge_group == "versionEdges" || selected_edge_group == "trigger_from"){
                //(versionEdgesのときなど)自身が指されている(左側のものと繋がっている)edgeを除外
                if(defaultThinkingProcess.ownNetwork.getConnectedNodes(selected_edge_id[i])[1] != selected_node_id){
                    num = i;
                }
            }
        }
        edge_id = selected_edge_id[num];
        const connect_node_ids = defaultThinkingProcess.ownNetwork.getConnectedNodes(selected_edge_id[num]);
        let from_node = connect_node_ids[0];
        let to_node = connect_node_ids[1];
        if(defaultThinkingProcess.edges.get(selected_edge_id[num]).group == "trigger_to"){
            // triggerを指しているedgeだった場合，その先のversionノードを取得する
            let e = defaultThinkingProcess.ownNetwork.getConnectedEdges(connect_node_ids[1]);
            let n = defaultThinkingProcess.ownNetwork.getConnectedNodes(e[1])
            to_node = n[1];
        }
         defaultThinkingProcess.addTriggerNode("New", trigger_id, edge_id, from_node, to_node, activity_id, t_label, t_type, t_time, null, null)
        // document.getElementById("trigger_time").reset();
        // document.getElementById("trigger_activity").reset();
        // document.getElementById("trigger_content").reset();   
    }else if(selected_edge_id.length == 1 && (defaultThinkingProcess.edges.get(selected_edge_id[0]).group == "versionEdges" || defaultThinkingProcess.edges.get(selected_edge_id[0]).group == "trigger_from")){
        //versionもしくはtriggerのエッジが選択されている時，それにつながるnode_id(2つ)を取得する
        const connect_node_ids = defaultThinkingProcess.ownNetwork.getConnectedNodes(selected_edge_id);
        let from_node = connect_node_ids[0];
        let to_node = connect_node_ids[1];
        if(defaultThinkingProcess.edges.get(selected_edge_id[0]).group == "trigger_from"){
            // triggerを指しているedgeだった場合，その先のversionノードを取得する
            let e = defaultThinkingProcess.ownNetwork.getConnectedEdges(connect_node_ids[1]);
            let n = defaultThinkingProcess.ownNetwork.getConnectedNodes(e[1])
            to_node = n[1];
        }
         defaultThinkingProcess.addTriggerNode("New", trigger_id, selected_edge_id[0], from_node, to_node, activity_id, t_label, t_type, t_time, null, null)
        // document.getElementById("trigger_time").reset();
        // document.getElementById("trigger_activity").reset();
        // document.getElementById("trigger_content").reset();   
        return;
    }else{
        alert(translateThinkingProcessText('追加したい箇所のエッジを選択してください'));
        return;
    }
}

function ShowRelatedProcess(mode){
    // checkboxの状態を取得
    check = document.getElementById("checkbox_process");

    // 兄弟ノードを含めた表示
    if(mode=='brother'){
        // checlboxがチェックされている時の処理
        if(check.checked == true){
            console.log(check);
            displayTriggerData("AddBrother", "trigger_candidate_list");
        }
        else{
            console.log(check);
            defaultThinkingProcess = new ThinkingProcess("myProcessnetwork", "load");
            displayTriggerData("allRE", "trigger_candidate_list");
        }
    }// 整合性ラベルのついたノードを含めた表示
    if(mode=='consistency'){
        console.log(mode);
        // checlboxがチェックされている時の処理
        if(check.checked == true){
            
        }
        else{
          
        }
    }
    
}

function prepareFloatingThinkingProcessOverlay(container){
    if(!container) return;
    if(!container.__floatingOriginalParent){
        container.__floatingOriginalParent = container.parentNode;
        container.__floatingOriginalNextSibling = container.nextSibling;
    }
    if(container.parentNode !== document.body){
        document.body.appendChild(container);
    }
    container.classList.add('is-floating-overlay');
    container.style.removeProperty('width');
    container.style.removeProperty('height');
    container.style.removeProperty('min-height');
    container.style.removeProperty('flex');
    container.style.display = 'flex';

    if(!container.style.left || !container.style.top){
        var width = Math.min(960, Math.max(520, window.innerWidth * 0.72));
        container.style.left = Math.max(16, Math.round((window.innerWidth - width) / 2)) + 'px';
        container.style.top = Math.max(16, Math.round(window.innerHeight * 0.08)) + 'px';
    }

    if(container.__floatingDragBound) return;
    container.__floatingDragBound = true;
    var handle = container.querySelector('#buttoncluster');
    if(!handle) return;
    handle.addEventListener('mousedown', function(event){
        if(event.button !== 0 || (event.target && event.target.closest('input, button, a, select, textarea'))) return;
        event.preventDefault();
        var rect = container.getBoundingClientRect();
        var offsetX = event.clientX - rect.left;
        var offsetY = event.clientY - rect.top;
        function move(moveEvent){
            var maxLeft = Math.max(8, window.innerWidth - container.offsetWidth - 8);
            var maxTop = Math.max(8, window.innerHeight - 48);
            container.style.left = Math.max(8, Math.min(maxLeft, moveEvent.clientX - offsetX)) + 'px';
            container.style.top = Math.max(8, Math.min(maxTop, moveEvent.clientY - offsetY)) + 'px';
        }
        function stop(){
            document.removeEventListener('mousemove', move, true);
            document.removeEventListener('mouseup', stop, true);
        }
        document.addEventListener('mousemove', move, true);
        document.addEventListener('mouseup', stop, true);
    }, false);
}

function showThinkingProcessMap(others_node, options){
    // 重複呼び出しを短時間内に受けた場合は無視する（UIからの二重トリガ防止）
    try{
        const now = Date.now();
        if(now - _lastShowThinkingProcessCall < 300){
            console.log('showThinkingProcessMap: duplicate call ignored');
            console.trace();
            return;
        }
        _lastShowThinkingProcessCall = now;
        console.trace('showThinkingProcessMap called');
    }catch(e){/* no-op */}

    // 共有された思考過程ノードの閲覧かどうか(自分自身の場合は others_node==null )
    if(others_node){
        console.log("他者の思考過程表出化マップを表示");
        // 未使用エリアの表示切替は停止中: document.getElementById('feedback_area').style.display = "block";
        // 未使用エリアの表示切替は停止中: document.getElementById('xml_upload_area').style.display = "block";
        var processContainer = document.getElementById('process_others_network_container');
        var floatingDisplay = !!(options && options.floating);
        if(floatingDisplay){
            prepareFloatingThinkingProcessOverlay(processContainer);
        }else{
            $('#process_others_network_container').css('display','block');
        }
        // organizational_container をフレックスレイアウトに変更して垂直分割対応
        // Use a definite pixel height to avoid a feedback loop where vis.js canvas height expands the container,
        // and the container expansion makes the canvas even larger.
        if(!floatingDisplay){
        try{
            var oc = document.getElementById('organizational_container');
            if(oc && !oc.dataset.prevHeight){
                oc.dataset.prevHeight = String(oc.getBoundingClientRect().height || '');
            }
        }catch(_){}
        var baseH = null;
        try{
            var oc2 = document.getElementById('organizational_container');
            baseH = oc2 ? Math.round(oc2.getBoundingClientRect().height) : null;
        }catch(_){ baseH = null; }
        if(!baseH || isNaN(baseH) || baseH < 300){
            // fallback: viewport-based estimate
            try{ baseH = Math.max(520, Math.round(window.innerHeight * 0.75)); }catch(_){ baseH = 720; }
        }
        var halfH = Math.max(240, Math.floor(baseH / 2));

        $('#organizational_container').css({
            'display':'flex',
            'flex-direction':'column',
            'width':'calc(100vw - 350px)',
            'height': baseH + 'px'
        });
        $('#myOrganizationalnetwork_area').css({
            'flex':'0 0 ' + halfH + 'px',
            'height': halfH + 'px',
            'min-height': halfH + 'px'
        });
        $('#process_others_network_container').css({
            'width':'100%',
            'flex':'0 0 ' + halfH + 'px',
            'height': halfH + 'px',
            'min-height': halfH + 'px',
            'display':'flex',
            'flex-direction':'column'
        });
        // After layout change, force redraw so the Organizational map doesn't disappear.
        try{
            if(typeof defaultOrganizational !== 'undefined' && defaultOrganizational && defaultOrganizational.ownNetwork){
                setTimeout(function(){
                    try{ defaultOrganizational.ownNetwork.redraw(); }catch(_){}
                    try{ defaultOrganizational.ownNetwork.fit({animation:false}); }catch(_){}
                }, 0);
            }
        }catch(_){}
        }
    
        defaultThinkingProcess = new ThinkingProcess("othersProcessnetwork", "load");
        displayTriggerData("who", others_node);
    }else{
        console.log("自分自身の思考過程表出化マップを表示");
        // 未使用エリアの表示切替は停止中: document.getElementById('feedback_area').style.display = "block";
        // 未使用エリアの表示切替は停止中: document.getElementById('xml_upload_area').style.display = "block";
        $('#process_network_container').css('display','flex');
        // $('#jsmind_container').css('width','calc(100vw - 350px)');
        $('#jsmind_container').css('width','100%');
        $('#jsmind_container').css('height','50%');
        $('#mind').css('height','90%');
        $('#document').hide();
        const frame_dom = document.getElementsByClassName("inquiry_area");
        frame_dom[0].style.border = "solid 5px #ccc";
        $("#myProcessnetwork").css({
        width: '100%', 
        height: '400px' // 必要に応じて調整
        });
    
        defaultThinkingProcess = new ThinkingProcess("myProcessnetwork", "load");
        displayTriggerData("all", "trigger_candidate_list");
    }
    
  
    if (window.applyTriggerAreaLanguage) window.applyTriggerAreaLanguage(window.currentLang || 'ja');

}

function showTriggerDisplay(){
    const lesson = attachLessonDisplayToLessonArea();
    if (lesson) lesson.style.display = 'none';
    const trigger = document.getElementById('trigger_display');
    if (trigger) trigger.style.display = 'block';
    if (window.applyTriggerAreaLanguage) window.applyTriggerAreaLanguage(window.currentLang || 'ja');
}

function closeThinkingProcessMap(){
  
    // 未使用エリアの表示切替は停止中: document.getElementById('feedback_area').style.display = "block";
    // 未使用エリアの表示切替は停止中: document.getElementById('xml_upload_area').style.display = "block";
    $('#process_network_container').css('display','none');
    // $('#jsmind_container').css('width','calc(100vw - 350px)');
    $('#jsmind_container').css('height','100%');
    $('#mind').css('height','90%');
    // showThinkingProcessMap() hides the document pane; restore it on close.
    try{ $('#document').show(); }catch(_){ }
    showTriggerDisplay();
}

// nodeIDをidにもつノードのtypeがラベルの時，思考過程表出化マップを開く
function proposeThinkingProcess(nodeID){

    const nodeClass = Get_NodeInfo(nodeID, "class").replace(" selected", "");
    console.log(nodeClass);
    if(nodeClass =='primary_label' || nodeClass =='issue_label' || nodeClass =='consistency_label' ){
        var label_name = "注目すべきである";
        switch (nodeClass){
            case 'primary_label':
                label_name = "主軸である";
                break;
            case 'issue_label':
                label_name = "課題である";
                break;
            case 'consistency_label':
                label_name = "整合性を保つべきである";
                break;
        }
        alert("「"+ label_name +"」と考えていた思考が変わりましたね．なぜそのように考えたのかを振り返ってみましょう！");
        showThinkingProcessMap();
    }
}

// ロードした際の関数
window.addEventListener('load', () => {

    // 初期表示時点でいくつかのオブジェクトを非表示にする
    document.getElementById("process_network_container").style.display="none";
    defaultThinkingProcess = new ThinkingProcess("myProcessnetwork", "load");
    // マップ編集ボタンにイベント付与
    $(`#process_addNode`).on("click", e => {
        defaultThinkingProcess.addNewNode();
    });
    $(`#process_removeNode`).on("click", e => {
        defaultThinkingProcess.deleteNode();
    });
    $(`#process_startEditEdge`).on("click", e => {
        defaultThinkingProcess.SelectEditEdge();
    });
    $(`#process_removeEdge`).on("click", e => {
        defaultThinkingProcess.deleteEdge();
    });
    $(`#process_ZoomIn`).on("click", e => {
        defaultThinkingProcess.zoomIn();
    });
    $(`#process_ZoomOut`).on("click", e => {
        defaultThinkingProcess.zoomOut();
    });

    // グローバルなインライン呼び出しに対応するラッパーを登録
    // index.php の onclick="selectShareOrganization()" が存在するため、グローバル関数を用意する
    window.selectShareOrganization = function() {
        if (typeof defaultThinkingProcess !== 'undefined' && defaultThinkingProcess.selectShareOrganization) {
            defaultThinkingProcess.selectShareOrganization();
        } else {
            console.error('selectShareOrganization: defaultThinkingProcess が利用できません');
            alert('共有機能が利用できません。ページをリロードしてください。');
        }
    };

    const accordionHeaders = document.querySelectorAll('#accordion_discussion .accordion-header');
    accordionHeaders.forEach(header => {
      header.addEventListener('click', function () {
        const accordionItem = this.parentElement;
        accordionItem.classList.toggle('active');
      });
    });
});
