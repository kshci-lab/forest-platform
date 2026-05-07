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
    { key: "mindAllButton", selector: "#mind_all input.button5", kind: "value" },
    { key: "mindAllLabel", selector: "#mind_all b", kind: "text" },
    { key: "mindmapMenuTitle", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(1)", kind: "text" },
    { key: "mindmapMenuAddQuestion", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(2) button", kind: "text" },
    { key: "mindmapMenuAddAnswer", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(3) button", kind: "text" },
    { key: "mindmapMenuDeleteNode", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(4) button", kind: "text" },
    { key: "mindmapMenuUpdateVersion", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(5) button", kind: "text" },
    { key: "mindmapMenuShowProcess", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(6) button", kind: "text" },
    { key: "mindmapMenuDocumentTitle", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(7)", kind: "text" },
    { key: "mindmapMenuAddToDocument", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(8) button", kind: "text" },
    { key: "mindmapMenuAddAsLogic", selector: "#mindmap_conmenu ul:first-of-type li:nth-of-type(9) button", kind: "text" },
    { key: "inquiryInfoTitle", selector: ".inquiry_area > div:nth-of-type(1)", kind: "text" },
    { key: "inquiryIntentionTitle", selector: ".inquiry_area > div:nth-of-type(4)", kind: "text" },
    { key: "inquiryRationalityTitle", selector: ".inquiry_area > div:nth-of-type(6)", kind: "text" },
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
      triggerAdd: "Add Trigger",
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
    if (window.setInquiryLang) {
      window.setInquiryLang(lang);
    } else if (window.applyInquiryLanguageToCurrentArea) {
      window.applyInquiryLanguageToCurrentArea(lang);
    }
  }

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
