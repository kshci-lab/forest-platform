(function(){
  'use strict';

  function normalizeText(text){
    return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function getInquiryAreas(){
    return Array.prototype.slice.call(document.querySelectorAll('.inquiry_area'));
  }

  function getInquirySections(){
    var lang = window.currentLang || 'ja';
    return [
      { id: 'testxml', label: lang === 'en' ? 'Externalized Information' : '情報の表出化' },
      { id: 'intention', label: lang === 'en' ? 'Reason / Purpose' : '理由・目的' },
      { id: 'rationality', label: lang === 'en' ? 'Rationality' : '合理性' }
    ];
  }

  function ensureSectionTitles(area){
    getInquirySections().forEach(function(section){
      var container = area.querySelector('#' + section.id);
      if(!container) return;
      var title = container.querySelector('.inquiry-section-title');
      if(!title){
        title = document.createElement('div');
        title.className = 'inquiry-section-title';
        container.insertBefore(title, container.firstChild);
      }
      if(title.textContent !== section.label){
        title.textContent = section.label;
      }
    });
  }

  function getItemText(item){
    if(!item) return '';
    var link = item.querySelector('a');
    var parts = [];
    if(link){
      parts.push(link.textContent || '');
      parts.push(link.getAttribute('data-ja-text') || '');
      parts.push(link.getAttribute('concept_id') || '');
      parts.push(link.id || '');
    }
    parts.push(item.className || '');
    return parts.join(' ');
  }

  function getInquiryItems(area){
    if(!area) return [];
    return Array.prototype.slice.call(area.querySelectorAll('#testxml ul, #ont ul, #intention ul, #rationality ul'));
  }

  function enhanceInquiryItems(area){
    if(!area) return;
    ensureSectionTitles(area);
    getInquiryItems(area).forEach(function(item){
      item.classList.add('inquiry-item');
      var link = item.querySelector('a');
      if(link){
        item.setAttribute('data-inquiry', link.getAttribute('data-ja-text') || link.textContent || '');
        item.setAttribute('data-concept', link.getAttribute('concept_id') || item.className || '');
      }
    });
  }

  function updateSectionTitleVisibility(area){
    getInquirySections().forEach(function(section){
      var container = area.querySelector('#' + section.id);
      if(!container) return;
      var title = container.querySelector('.inquiry-section-title');
      if(!title) return;
      var visibleItems = Array.prototype.slice.call(container.querySelectorAll('ul')).filter(function(item){
        return item.style.display !== 'none';
      });
      var nextTitleDisplay = visibleItems.length ? '' : 'none';
      if(title.style.display !== nextTitleDisplay){
        title.style.display = nextTitleDisplay;
      }
    });
  }

  function getSearchInput(area){
    return area ? area.querySelector('.inquiry-search-input') : null;
  }

  function getSearchResult(area){
    return area ? area.querySelector('.inquiry-search-result') : null;
  }

  function hasSearchQuery(area){
    var input = getSearchInput(area);
    return !!(input && normalizeText(input.value));
  }

  function applyInquirySearch(area){
    area = area || document.querySelector('.inquiry_area');
    var input = getSearchInput(area);
    var result = getSearchResult(area);
    if(!area || !input) return;

    enhanceInquiryItems(area);
    var query = normalizeText(input.value);
    var items = getInquiryItems(area);
    var matched = 0;

    items.forEach(function(item){
      var visible = !query || normalizeText(getItemText(item)).indexOf(query) !== -1;
      var nextItemDisplay = visible ? '' : 'none';
      if(item.style.display !== nextItemDisplay){
        item.style.display = nextItemDisplay;
      }
      if(visible) matched += 1;
    });

    if(result){
      result.textContent = query ? (matched + ' / ' + items.length) : '';
    }
    updateSectionTitleVisibility(area);
  }

  function runCurrentModeInquiry(area){
    var select = document.querySelector("form[name='target_mode'] select[name='Select1']");
    var selectedIndex = select ? select.selectedIndex : 0;
    var usePresentationInquiry = selectedIndex === 1 || selectedIndex === 2;
    if(usePresentationInquiry && typeof window.P_showGeneration === 'function'){
      window.P_showGeneration();
    } else if(typeof window.showGeneration === 'function'){
      window.showGeneration();
    }
    setTimeout(function(){
      applyInquirySearch(area);
    }, 0);
  }

  function handleSearchInput(area){
    var isActive = hasSearchQuery(area);

    if(isActive && !area.__inquirySearchActive){
      area.__inquirySearchActive = true;
      // Node selection replaces the list with related questions. Reload the
      // mode's complete list once so search always uses the full source.
      runCurrentModeInquiry(area);
      return;
    }

    area.__inquirySearchActive = isActive;
    applyInquirySearch(area);
  }

  function initInquirySearchArea(area){
    ensureInquirySearchForm(area);
    var input = getSearchInput(area);
    var showAll = area.querySelector('.inquiry-show-all');
    if(!input || input.__inquirySearchBound) return;
    var applyTimer = null;
    var scheduleApply = function(){
      if(applyTimer !== null) return;
      applyTimer = setTimeout(function(){
        applyTimer = null;
        applyInquirySearch(area);
      }, 0);
    };

    input.__inquirySearchBound = true;
    input.addEventListener('input', function(){
      handleSearchInput(area);
    }, false);
    input.addEventListener('search', function(){
      handleSearchInput(area);
    }, false);
    if(showAll){
      showAll.addEventListener('click', function(){
        input.value = '';
        area.__inquirySearchActive = false;
        runCurrentModeInquiry(area);
        try{ input.focus(); }catch(_){}
      }, false);
    }
    if(window.MutationObserver){
      var observer = new MutationObserver(function(){
        scheduleApply();
      });
      ['testxml','ont','intention','rationality'].forEach(function(id){
        var target = area.querySelector('#' + id);
        if(target) observer.observe(target, { childList: true, subtree: true });
      });
    }

    applyInquirySearch(area);
  }

  function initInquirySearch(){
    getInquiryAreas().forEach(initInquirySearchArea);
  }

  function ensureInquirySearchForm(area){
    if(!area) return;
    var form = area.querySelector('.inquiry-search');
    if(!form){
      form = document.createElement('div');
      form.className = 'inquiry-search';
      area.insertBefore(form, area.firstChild);
    }
    var wrapper = form.querySelector('.search-box-wrapper');
    if(!wrapper){
      wrapper = document.createElement('div');
      wrapper.className = 'search-box-wrapper';
      form.insertBefore(wrapper, form.firstChild);
    }
    if(!wrapper.querySelector('.inquiry-show-all')){
      var showAll = document.createElement('button');
      showAll.type = 'button';
      if(!document.getElementById('showQuestionsBtn')){
        showAll.id = 'showQuestionsBtn';
      }
      showAll.className = 'inquiry-show-all';
      showAll.textContent = 'All';
      wrapper.appendChild(showAll);
    }
    if(!wrapper.querySelector('.inquiry-search-input')){
      var input = document.createElement('input');
      input.type = 'search';
      if(!document.getElementById('inquiry_search_input')){
        input.id = 'inquiry_search_input';
      }
      input.className = 'inquiry-search-input';
      input.placeholder = 'Search questions...';
      input.autocomplete = 'off';
      wrapper.appendChild(input);
    }
    if(!form.querySelector('.inquiry-search-result')){
      var result = document.createElement('div');
      if(!document.getElementById('inquiry_search_result')){
        result.id = 'inquiry_search_result';
      }
      result.className = 'inquiry-search-result';
      result.setAttribute('aria-live', 'polite');
      form.appendChild(result);
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initInquirySearch, false);
  } else {
    initInquirySearch();
  }

  window.applyInquirySearch = function(){
    getInquiryAreas().forEach(applyInquirySearch);
  };
  window.isInquirySearchActive = function(){
    return getInquiryAreas().some(hasSearchQuery);
  };
  window.updateFilter = function(value){
    getInquiryAreas().forEach(function(area){
      var input = getSearchInput(area);
      if(input) input.value = value || '';
      handleSearchInput(area);
    });
  };
})();
