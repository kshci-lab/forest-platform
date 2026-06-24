(function () {
  "use strict";

  var translationTargets = [
    { key: "logoutButton", selector: "#logout-button", kind: "value" },
    { key: "sheetSelectButton", selector: "#sheet-select-button", kind: "value" },
    { key: "tabMain", selector: ".tabnav > li:nth-of-type(1) a", kind: "text" },
    { key: "tabPast", selector: ".tabnav > li:nth-of-type(2) a", kind: "text" },
    { key: "tabOrg", selector: ".tabnav > li:nth-of-type(3) a", kind: "text" },
    { key: "modeOption0", selector: "form[name='target_mode'] select[name='Select1'] option:nth-of-type(1)", kind: "text" },
    { key: "modeOption1", selector: "form[name='target_mode'] select[name='Select1'] option:nth-of-type(2)", kind: "text" },
    { key: "modeOption2", selector: "form[name='target_mode'] select[name='Select1'] option:nth-of-type(3)", kind: "text" },
    { key: "modeOption3", selector: "form[name='target_mode'] select[name='Select1'] option:nth-of-type(4)", kind: "text" },
    { key: "modeChangeButton", selector: "form[name='target_mode'] input.button3", kind: "value" },
    { key: "toolbarAddQuestion", selector: "#jsmind_nav > div > button:nth-of-type(1)", kind: "text" },
    { key: "toolbarAddAnswer", selector: "#jsmind_nav > div > button:nth-of-type(2)", kind: "text" },
    { key: "toolbarAddLabel", selector: "#jsmind_nav > div > button:nth-of-type(3)", kind: "text" },
    { key: "toolbarRemoveNode", selector: "#jsmind_nav > div > button:nth-of-type(4)", kind: "text" },
    { key: "toolbarZoomIn", selector: "#zoom-in-button", kind: "text" },
    { key: "toolbarZoomOut", selector: "#zoom-out-button", kind: "text" },
    { key: "toolbarSnapshot", selector: "#map-snapshot-button", kind: "text" },
    { key: "toolbarScreenshot", selector: "#jsmind_nav > div > button[onclick='screen_shot();']", kind: "text" },
    { key: "presenAddQuestion", selector: "#presen_menu button:nth-of-type(1)", kind: "text" },
    { key: "presenAddAnswer", selector: "#presen_menu button:nth-of-type(2)", kind: "text" },
    { key: "presenReflect", selector: "#presen_menu button:nth-of-type(3)", kind: "text" },
    { key: "presenUnreflected", selector: "#presen_menu button:nth-of-type(4)", kind: "text" },
    { key: "presenDeleteRelation", selector: "#presen_menu button:nth-of-type(5)", kind: "text" },
    { key: "mindmapMenuTitle", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(1)", kind: "text" },
    { key: "mindmapMenuAddQuestion", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(2) button", kind: "text" },
    { key: "mindmapMenuAddAnswer", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(3) button", kind: "text" },
    { key: "mindmapMenuDeleteNode", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(4) button", kind: "text" },
    { key: "mindmapMenuUpdateVersion", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(5) button", kind: "text" },
    { key: "mindmapMenuShowProcess", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(6) button", kind: "text" },
    { key: "mindmapMenuDocumentTitle", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(7)", kind: "text" },
    { key: "mindmapMenuAddToDocument", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(8) button", kind: "text" },
    { key: "mindmapMenuAddAsLogic", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(9) button", kind: "text" },
    { key: "inquiryInfoTitle", selector: ".inquiry-info-title", kind: "text" },
    { key: "inquiryIntentionTitle", selector: ".inquiry-intention-title", kind: "text" },
    { key: "inquiryRationalityTitle", selector: ".inquiry-rationality-title", kind: "text" },
    { key: "scenarioTitlePlaceholder", selector: "#scenario_title", kind: "placeholder" },
    { key: "networkAddNode", selector: "#mrnb_addNode", kind: "value" },
    { key: "networkRemoveNode", selector: "#mrnb_removeNode", kind: "value" },
    { key: "networkAddEdge", selector: "#mrnb_startEditEdge", kind: "value" },
    { key: "networkRemoveEdge", selector: "#mrnb_removeEdge", kind: "value" },
    { key: "networkZoomIn", selector: "#mrnb_ZoomIn", kind: "value" },
    { key: "networkZoomOut", selector: "#mrnb_ZoomOut", kind: "value" },
    { key: "networkMenu1", selector: "#net_conmenu1", kind: "text" },
    { key: "networkMenu2", selector: "#net_conmenu2", kind: "text" },
    { key: "networkMenu3", selector: "#net_conmenu3", kind: "text" },
    { key: "networkMenu4", selector: "#net_conmenu4", kind: "text" },
    { key: "ontologySelect", selector: "#ontology_select", kind: "value" },
    { key: "recruitOption0", selector: "#recruitselectionlist option:nth-of-type(1)", kind: "text" },
    { key: "recruitOption1", selector: "#recruitselectionlist option:nth-of-type(2)", kind: "text" },
    { key: "recruitSelect", selector: "#recruit_select", kind: "value" },
    { key: "processAddNode", selector: "#process_addNode", kind: "value" },
    { key: "processRemoveNode", selector: "#process_removeNode", kind: "value" },
    { key: "processAddEdge", selector: "#process_startEditEdge", kind: "value" },
    { key: "processRemoveEdge", selector: "#process_removeEdge", kind: "value" },
    { key: "processZoomIn", selector: "#process_ZoomIn", kind: "value" },
    { key: "processZoomOut", selector: "#process_ZoomOut", kind: "value" },
    { key: "processMenu1", selector: "#process_conmenu1", kind: "text" },
    { key: "processMenu4", selector: "#process_conmenu4", kind: "text" },
    { key: "processOntologySelect", selector: "#p_ontology_select", kind: "value" },
    { key: "processRecruitOption0", selector: "#t_Process_recruitselectionlist option:nth-of-type(1)", kind: "text" },
    { key: "processRecruitOption1", selector: "#t_Process_recruitselectionlist option:nth-of-type(2)", kind: "text" },
    { key: "processRecruitSelect", selector: "#p_recruit_select", kind: "value" },
    { key: "triggerAdd", selector: "#inputTriggerbutton", kind: "value" },
    { key: "lessonShareButton", selector: "#lesson_display .lessonbutton", kind: "value" },
    { key: "tabCooperation", selector: "#org-tab-cooperation", kind: "text" },
    { key: "tabCombination", selector: "#org-tab-combination", kind: "text" },
    { key: "groupSelectLabel", selector: "#group_select_label", kind: "text" },
    { key: "orgZoomIn", selector: "#organizational_ZoomIn", kind: "value" },
    { key: "orgZoomOut", selector: "#organizational_ZoomOut", kind: "value" },
    { key: "orgMenu1", selector: "#organizational_conmenu1", kind: "text" },
    { key: "orgMenu4", selector: "#organizational_conmenu4", kind: "text" },
    { key: "orgRecruitOption0", selector: "#t_Organizational_recruitselectionlist option:nth-of-type(1)", kind: "text" },
    { key: "orgRecruitOption1", selector: "#t_Organizational_recruitselectionlist option:nth-of-type(2)", kind: "text" },
    { key: "orgRecruitSelect", selector: "#p_recruit_select", kind: "value" },
    { key: "kfragReset", selector: "#kfrag-reset", kind: "text" },
    { key: "kfragUndo", selector: "#kfrag-undo", kind: "text" },
    { key: "kfragRedo", selector: "#kfrag-redo", kind: "text" },
    { key: "fragmentDiscussedToggle", selector: "#fragment-discussed-toggle", kind: "text" },
    { key: "selectedLabel", selector: "#fragment-selected-area .selected-label", kind: "text" },
    { key: "discussionPlaceholder", selector: "#discussion_message_list .discussion-placeholder", kind: "text" },
    { key: "discussionInputPlaceholder", selector: "#discussion_input", kind: "placeholder" },
    { key: "discussionPostButton", selector: "#discussion_post_form .post-button", kind: "text" },
    { key: "kraAreaOption0", selector: "#kra_area_select option:nth-of-type(1)", kind: "text" },
    { key: "kraAreaOption1", selector: "#kra_area_select option:nth-of-type(2)", kind: "text" },
    { key: "kraAreaOption2", selector: "#kra_area_select option:nth-of-type(3)", kind: "text" },
    { key: "kraKnowledgePlaceholder", selector: "#kra_knowledge_content", kind: "placeholder" },
    { key: "kraCommentPlaceholder", selector: "#kra_comment_input", kind: "placeholder" },
    { key: "kraSubmit", selector: "#kra-submit", kind: "text" },
    { key: "langLabelJa", selector: "#lang-label-ja", kind: "text" },
    { key: "langLabelEn", selector: "#lang-label-en", kind: "text" }
  ];

  var dictionaries = {
    ja: {},
    en: {
      logoutButton: "Logout",
      sheetSelectButton: "Back to Sheet Selection",
      tabMain: "Thinking Support",
      tabPast: "Past Mind Maps",
      tabOrg: "Organizational Knowledge Map",
      modeOption0: "Thinking Support Mode",
      modeOption1: "Document Creation Prep Mode",
      modeOption2: "Document Creation Mode",
      modeOption3: "Meeting Reflection Mode",
      modeChangeButton: "Apply",
      toolbarAddQuestion: "Add Question Node",
      toolbarAddAnswer: "Add Answer Node",
      toolbarAddLabel: "Add Label",
      toolbarRemoveNode: "Delete Node",
      toolbarZoomIn: "Zoom In",
      toolbarZoomOut: "Zoom Out",
      toolbarSnapshot: "Update Map Ver",
      toolbarScreenshot: "Screenshot",
      presenAddQuestion: "Add Question",
      presenAddAnswer: "Add Answer",
      presenReflect: "Reflect to Slides",
      presenUnreflected: "Unreflected Nodes",
      presenDeleteRelation: "Delete Relation",
      mindAllButton: "Question List",
      mindAllLabel: "Mind Map Mode",
      mindmapMenuTitle: "Node Actions",
      mindmapMenuAddQuestion: "Add Question Node",
      mindmapMenuAddAnswer: "Add Answer Node",
      mindmapMenuDeleteNode: "Delete Node",
      mindmapMenuUpdateVersion: "Update Node Ver",
      mindmapMenuShowProcess: "Show Thinking Process Map",
      mindmapMenuDocumentTitle: "Add Node to Document",
      mindmapMenuAddToDocument: "Add as Material",
      mindmapMenuAddAsLogic: "Add as Logic",
      inquiryInfoTitle: "[Externalized Information]",
      inquiryIntentionTitle: "[Reason/Purpose]",
      inquiryRationalityTitle: "[Rationality]",
      scenarioTitlePlaceholder: "Document title",
      networkAddNode: "Add Node",
      networkRemoveNode: "Delete Node",
      networkAddEdge: "Add Edge",
      networkRemoveEdge: "Delete Edge",
      networkZoomIn: "Zoom In",
      networkZoomOut: "Zoom Out",
      networkMenu1: "Change Label",
      networkMenu2: "Connect to Mind Map",
      networkMenu3: "Use / Reject",
      networkMenu4: "Cancel",
      ontologySelect: "Apply",
      recruitOption0: "Use",
      recruitOption1: "Reject",
      recruitSelect: "Apply",
      processAddNode: "Add Node",
      processRemoveNode: "Delete Node",
      processAddEdge: "Add Edge",
      processRemoveEdge: "Delete Edge",
      processZoomIn: "Zoom In",
      processZoomOut: "Zoom Out",
      processMenu1: "Learn",
      processMenu4: "Cancel",
      processOntologySelect: "Apply",
      processRecruitOption0: "Use",
      processRecruitOption1: "Reject",
      processRecruitSelect: "Apply",
      triggerAdd: " + Add Activity",
      lessonShareButton: "Share as Learning",
      tabCooperation: "Externalization",
      tabCombination: "Combination",
      groupSelectLabel: "Select Group:",
      orgZoomIn: "Zoom In",
      orgZoomOut: "Zoom Out",
      orgMenu1: "Show Thinking Process",
      orgMenu4: "Cancel",
      orgRecruitOption0: "Use",
      orgRecruitOption1: "Reject",
      orgRecruitSelect: "Apply",
      kfragReset: "Reset",
      kfragUndo: "Undo",
      kfragRedo: "Redo",
      fragmentDiscussedToggle: "Discussed",
      selectedLabel: "Selected fragments:",
      discussionPlaceholder: "Select fragments to start the discussion.",
      discussionInputPlaceholder: "Enter a comment...",
      discussionPostButton: "Post",
      kraAreaOption0: "Experience Knowledge",
      kraAreaOption1: "Issue / Strategy Relation",
      kraAreaOption2: "Other",
      kraKnowledgePlaceholder: "Describe the knowledge here",
      kraCommentPlaceholder: "Optional comment or note",
      kraSubmit: "Register",
      langLabelJa: "Japanese",
      langLabelEn: "English"
    }
  };

  var isApplyingLanguage = false;

  function getElements(selector) {
    return document.querySelectorAll(selector);
  }

  function readValue(element, kind) {
    if (kind === "value") return element.value;
    if (kind === "placeholder") return element.placeholder;
    return element.textContent;
  }

  function writeValue(element, kind, value) {
    if (kind === "value") {
      element.value = value;
    } else if (kind === "placeholder") {
      element.placeholder = value;
    } else {
      element.textContent = value;
    }
  }

  function captureJapaneseDefaults() {
    translationTargets.forEach(function (target) {
      var elements = getElements(target.selector);
      if (!elements.length) return;
      dictionaries.ja[target.key] = readValue(elements[0], target.kind);
    });
  }

  function applyLanguageSpecificLayout(lang) {
    window.currentLang = lang;
    if (document.body) {
      document.body.classList.toggle("lang-en", lang === "en");
    }
    applyTriggerAreaLanguage(lang);
    applyLessonDisplayLanguage(lang);
    if (window.setInquiryLang) {
      window.setInquiryLang(lang);
    } else if (window.applyInquiryLanguageToCurrentArea) {
      window.applyInquiryLanguageToCurrentArea(lang);
    }
  }

  function applyTriggerAreaLanguage(lang) {
    var triggerButton = document.getElementById("inputTriggerbutton");
    var triggerActivity = document.getElementById("trigger_activity");
    var triggerContent = document.getElementById("trigger_content");
    var triggerNew = document.getElementById("triggerNew");
    var isOpen = !!triggerActivity;
    var jaClosed = " \uFF0B \u6D3B\u52D5\u3092\u5165\u529B";
    var jaOpen = " \u00D7 \u9589\u3058\u308B";
    var jaOptions = [
      "-\u6D3B\u52D5\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044-",
      "\u601D\u8003\u652F\u63F4",
      "\u4F1A\u8B70\u5185\u7701",
      "\u4F1A\u8B70",
      "\u8CC7\u6599\u4F5C\u6210",
      "\u8CC7\u6599\u691C\u8A0E"
    ];

    if (triggerButton) {
      triggerButton.value = lang === "en"
        ? (isOpen ? "Close" : " + Add Activity")
        : (isOpen ? jaOpen : jaClosed);
    }

    if (triggerActivity) {
      var optionTexts = lang === "en"
        ? [
            "- Select an activity -",
            "Thinking Support",
            "Meeting Reflection",
            "Meeting",
            "Document Creation",
            "Document Review"
          ]
        : jaOptions;
      for (var i = 0; i < triggerActivity.options.length && i < optionTexts.length; i += 1) {
        triggerActivity.options[i].text = optionTexts[i];
      }
    }

    if (triggerContent) {
      triggerContent.placeholder = lang === "en"
        ? "Describe what happened in the activity"
        : "\u304D\u3063\u304B\u3051\u306B\u306A\u3063\u305F\u51FA\u6765\u4E8B\u3092\u8A18\u8FF0\u3057\u3066\u304F\u3060\u3055\u3044";
    }

    if (triggerNew) {
      triggerNew.value = lang === "en"
        ? "Add as Node"
        : "\u30CE\u30FC\u30C9\u3068\u3057\u3066\u8FFD\u52A0";
    }
  }

  window.applyTriggerAreaLanguage = applyTriggerAreaLanguage;

  function setPromptContent(container, parts) {
    if (!container) return;
    var currentValues = Array.prototype.map.call(container.querySelectorAll("textarea"), function (input) {
      return input.value || "";
    });
    var inputIndex = 0;
    container.innerHTML = "";
    parts.forEach(function (part) {
      if (part.type === "text") {
        container.appendChild(document.createTextNode(part.text));
      } else {
        var input = document.createElement("textarea");
        input.className = "lessonTextArea";
        input.rows = 1;
        input.placeholder = part.placeholder;
        input.value = currentValues[inputIndex] || "";
        inputIndex += 1;
        container.appendChild(input);
      }
    });
  }

  function getJapaneseLessonPromptParts(stageName) {
    if (!window.getLessonPromptDefinitions) return null;
    var definitions = window.getLessonPromptDefinitions();
    var definition = definitions.find(function (item) {
      return item.stageName === stageName;
    });
    if (!definition) return null;

    return {
      titleText: definition.titleText,
      parts: definition.parts.map(function (part) {
        if (typeof part === "string") {
          return { type: "text", text: part };
        }
        return { type: "input", placeholder: part.placeholder || "" };
      })
    };
  }

  function applyLessonDisplayLanguage(lang) {
    var lessonTitle = document.querySelector("#area_lesson_add .lesson-heading-title");
    var lessonTitleInput = document.querySelector("#area_lesson_add textarea[name='knowledge_fragment_title']");
    var stage1Title = document.querySelector("#area_lesson_add [data-stage='stage1']") ?
      document.querySelector("#area_lesson_add [data-stage='stage1']").previousElementSibling : null;
    var stage2Title = document.querySelector("#area_lesson_add [data-stage='stage2']") ?
      document.querySelector("#area_lesson_add [data-stage='stage2']").previousElementSibling : null;
    var stage3Title = document.querySelector("#area_lesson_add [data-stage='stage3']") ?
      document.querySelector("#area_lesson_add [data-stage='stage3']").previousElementSibling : null;
    var stage1 = document.querySelector("#area_lesson_add [data-stage='stage1']");
    var stage2 = document.querySelector("#area_lesson_add [data-stage='stage2']");
    var stage3 = document.querySelector("#area_lesson_add [data-stage='stage3']");

    if (lessonTitle) {
      lessonTitle.textContent = lang === "en"
        ? "Learning Summary"
        : "\u7D4C\u9A13\u77E5\u306E\u8981\u7D04";
    }

    if (lessonTitleInput) {
      lessonTitleInput.placeholder = lang === "en"
        ? "Enter a short title for what you learned"
        : "\u3069\u3093\u306A\u3053\u3068\u3092\u5B66\u3093\u3060\u304B\u306E\u8981\u7D04\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044";
    }

    if (stage1Title) {
      var jaStage1 = getJapaneseLessonPromptParts("stage1");
      stage1Title.textContent = lang === "en"
        ? "[Reflection on Experience]"
        : (jaStage1 ? jaStage1.titleText : "\u3010\u7D4C\u9A13\u306E\u632F\u308A\u8FD4\u308A\u3011");
    }
    if (stage2Title) {
      var jaStage2 = getJapaneseLessonPromptParts("stage2");
      stage2Title.textContent = lang === "en"
        ? "[Activity-Context-Specific Reflection]"
        : (jaStage2 ? jaStage2.titleText : "\u3010\u6D3B\u52D5\u6587\u8108\u56FA\u6709\u306E\u632F\u308A\u8FD4\u308A\u3011");
    }
    if (stage3Title) {
      var jaStage3 = getJapaneseLessonPromptParts("stage3");
      stage3Title.textContent = lang === "en"
        ? "[Research-Specific Reflection]"
        : (jaStage3 ? jaStage3.titleText : "\u3010\u7814\u7A76\u56FA\u6709\u306E\u632F\u308A\u8FD4\u308A\u3011");
    }

    if (stage1) {
      var jaStage1Prompt = getJapaneseLessonPromptParts("stage1");
      setPromptContent(stage1, lang === "en" ? [
        { type: "text", text: "In " },
        { type: "input", placeholder: "what situation" },
        { type: "text", text: ", I learned " },
        { type: "input", placeholder: "what I learned" },
        { type: "text", text: "." }
      ] : (jaStage1Prompt ? jaStage1Prompt.parts : [
        { type: "input", placeholder: "\u3069\u306E\u3088\u3046\u306B" },
        { type: "text", text: "\u8003\u3048\u305F\u3053\u3068\u3067\uFF0C" },
        { type: "input", placeholder: "\u4F55" },
        { type: "text", text: "\u304C\u9054\u6210\u3055\u308C\u305F\uFF0E" }
      ]));
    }

    if (stage2) {
      var jaStage2Prompt = getJapaneseLessonPromptParts("stage2");
      setPromptContent(stage2, lang === "en" ? [
        { type: "text", text: "In my actual thinking activity, " },
        { type: "input", placeholder: "what happened or what I noticed" },
        { type: "text", text: ", and I gained " },
        { type: "input", placeholder: "what I learned or realized" },
        { type: "text", text: "." }
      ] : (jaStage2Prompt ? jaStage2Prompt.parts : [
        { type: "text", text: "\u73FE\u5728\u306E\u601D\u8003\u306E\u6587\u8108\u3067" },
        { type: "input", placeholder: "\u3069\u306E\u3088\u3046\u306B\u8003\u3048\u308B\u3053\u3068/\u53D6\u308A\u7D44\u3080\u3053\u3068\uFF08\u624B\u6BB5\uFF09" },
        { type: "text", text: "\u304C\uFF0C\u7814\u7A76\u6D3B\u52D5\u306E" },
        { type: "input", placeholder: "\u4F55\u306B\u8CC7\u3059\u308B\uFF08\u76EE\u7684\uFF09" },
        { type: "text", text: "\uFF0E" }
      ]));
    }

    if (stage3) {
      var jaStage3Prompt = getJapaneseLessonPromptParts("stage3");
      setPromptContent(stage3, lang === "en" ? [
        { type: "text", text: "Based on that reflection, I want to " },
        { type: "input", placeholder: "what I want to do next" },
        { type: "text", text: ", and for that purpose, I need " },
        { type: "input", placeholder: "the perspective or effort I need" },
        { type: "text", text: "." }
      ] : (jaStage3Prompt ? jaStage3Prompt.parts : [
        { type: "text", text: "\u7814\u7A76\u306B\u53D6\u308A\u7D44\u3080\u3068\u304D\uFF0C" },
        { type: "input", placeholder: "\u4F55\u3092\u8003\u3048\u308B/\u53D6\u308A\u7D44\u3080\u3053\u3068\uFF08\u76EE\u7684\uFF09" },
        { type: "text", text: "\u304C\u5927\u5207\u3067\uFF0C\u305D\u306E\u305F\u3081\u306B\uFF0C" },
        { type: "input", placeholder: "\u4F55\u3092\u3069\u306E\u3088\u3046\u306B\u3069\u306E\u3088\u3046\u306A\u89B3\u70B9\u304B\u3089\u8003\u3048\u308B/\u53D6\u308A\u7D44\u3080\u3053\u3068\uFF08\u624B\u6BB5\uFF09" },
        { type: "text", text: "\u304C\u52B9\u679C\u7684\u3067\u3042\u308B\uFF0E" }
      ]));
    }
  }

  window.applyLessonDisplayLanguage = applyLessonDisplayLanguage;

  function setLanguage(lang) {
    var message = document.getElementById("language-switching-message");
    if (message) {
      message.textContent = "Switching language...";
      message.style.display = "block";
    }
    isApplyingLanguage = true;

    window.setTimeout(function () {
      translationTargets.forEach(function (target) {
        var translated = dictionaries[lang][target.key];
        if (typeof translated === "undefined") return;
        var elements = getElements(target.selector);
        if (!elements.length) return;
        for (var i = 0; i < elements.length; i += 1) {
          writeValue(elements[i], target.kind, translated);
        }
      });

      document.documentElement.lang = lang;
      applyLanguageSpecificLayout(lang);

      if (message) {
        message.style.display = "none";
      }
      isApplyingLanguage = false;
    }, 150);
  }

  document.addEventListener("DOMContentLoaded", function () {
    captureJapaneseDefaults();
    var toggle = document.getElementById("language-toggle");
    if (!toggle) return;

    setLanguage("ja");
    toggle.checked = false;
    toggle.addEventListener("change", function () {
      if (isApplyingLanguage) return;
      setLanguage(toggle.checked ? "en" : "ja");
    });
  });
}());

