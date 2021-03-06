var newsReader = {
  init: function() {
    this.cacheDom();
    this.bindEvents();
    this.loadData();
  },

  loadData: function() {
    var xhttp = new XMLHttpRequest();
    var self = this;
    xhttp.onreadystatechange = function() {
      if (this.readyState === 4 && this.status === 200) {
        self.reserveData = self.data = JSON.parse(this.responseText).results;
        self.renderTitles();
      }
    };
    xhttp.open('GET', 'data.json', true);
    xhttp.send();
  },

  cacheDom: function() {
    this.app = document.getElementById('app');
    this.textFilter = this.app.querySelector('#text-filter');
    this.listing = this.app.querySelector('#articles-listing');
    this.dateFilterForm = this.app.querySelector('#date-filter-form');
    this.fitlerButton = this.dateFilterForm.querySelector('#date-filter-submit');
    this.filterYear = this.dateFilterForm.querySelector('#date-filter-year');
    this.filterMonth = this.dateFilterForm.querySelector('#date-filter-month');
    this.filterDay = this.dateFilterForm.querySelector('#date-filter-day');
  },

  bindEvents: function() {
    this.listing.addEventListener('click', this.renderContent.bind(this));
    this.textFilter.addEventListener('keyup', this.filterArticlesByKeyword.bind(this));
    this.dateFilterForm.addEventListener('submit', this.filterArticlesByDate.bind(this));
  },

  isValidDate: function(dateString) {
    if (!/^(\d{2}|\d{1})\/(\d{2}|\d{1})\/\d{4}$/.test(dateString))
      return false;
    var parts = dateString.split('/');
    var day = parseInt(parts[1], 10);
    var month = parseInt(parts[0], 10);
    var year = parseInt(parts[2], 10);
    if (year < 1000 || year > 3000 || month === 0 || month > 12)
      return false;
    var monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    // if leap year
    if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0))
      monthLength[1] = 29;
    return day > 0 && day <= monthLength[month - 1];
  },

  filterArticlesByKeyword: function(event) {
    var filterText = event.target.value.trim();
    if (filterText !== '') {
      filterText = filterText.replace(/[^\w\s]/gi, ''); //remove illegal Regex characters
      var filterRE = new RegExp(filterText, 'i');
      this.data = this.reserveData.filter(function(article) {
        return filterRE.test(article.title) || filterRE.test(article.content);
      });
   
    } else {
      this.data = this.reserveData;
    }
    this.renderTitles();
  },

  getDate: function(inputDateForm) {
    var inputDay = inputDateForm.querySelector('#date-filter-day').value.trim();
    var inputMonth = inputDateForm.querySelector('#date-filter-month').value.trim();
    var inputYear = inputDateForm.querySelector('#date-filter-year').value.trim();
    var date;
    if (this.isValidDate(`${inputDay}/${inputMonth}/${inputYear}`)) {
      date = new Date(inputYear, inputMonth - 1, inputDay);
      date.setHours(0, 0, 0, 0);
    }
    return date;
  },

  filterArticlesByDate: function(event) {
    event.preventDefault();
    event.target.querySelector('#date-filter-error').style.display = 'none';
    var date = this.getDate(event.target);
    if (event.target.querySelector('#clear-filter')) {
      this.clearDateFilter();
    } else if (!date) {
      event.target.querySelector('#date-filter-error').style.display = 'inline-block';
    } else {
      this.data = this.reserveData.filter(function(article) {
        articleDate = new Date(article.publishedDate);
        articleDate.setHours(0, 0, 0, 0);
        return date.valueOf() === articleDate.valueOf();
      });
      this.swapDateFilterButton();
      if (this.data.length) {
        this.renderTitles();
      } else {
        this.renderNoResultMsg();
      }
    }
  },

  renderNoResultMsg: function() {
    while (this.listing.firstChild) this.listing.removeChild(this.listing.firstChild);
    var msg = 'Oops! No articles for that date :(';
    var msgDiv = document.createElement('div');
    msgDiv.innerHTML = msg;
    msgDiv.setAttribute('id', 'empty-result');
    this.app.appendChild(msgDiv);
  },

  swapDateFilterButton: function() {
    this.fitlerButton.setAttribute('id', 'clear-filter');
    this.fitlerButton.innerHTML = 'Clear filter';
  },

  clearDateFilter: function() {
    this.data = this.reserveData;
    this.fitlerButton.setAttribute('id', 'date-filter-submit');
    this.fitlerButton.innerHTML = 'Filter by date';
    this.filterYear.value = this.filterMonth.value = this.filterDay.value = '';
    this.renderTitles();
  },

  renderTitles: function(data, listing) {
    var storyItem, titleDiv, titleElement, title, publisherDate, publisher, date;
    this.listing.innerHTML = '';
    this.data.forEach(function(story, index) {
      storyItem = document.createElement('LI');
      titleDiv = document.createElement('DIV');
      titleElement = document.createElement('H2');
      titleLink = document.createElement('A');
      titleLink.innerHTML = story.title;
      titleElement.appendChild(titleLink);
      publisherDate = document.createElement('DIV');
      publisher = story.publisher;
      date = new Date(story.publishedDate).toLocaleString("en-us", {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      publisherDate.setAttribute('class', 'publisher_date');
      publisherDate.innerHTML = `${publisher} &nbsp ${date}`;
      titleDiv.appendChild(titleElement);
      titleDiv.appendChild(publisherDate);
      storyItem.appendChild(titleDiv);
      storyItem.setAttribute('class', 'headline');
      this.listing.appendChild(storyItem);
    }.bind(this));
    if (this.listing.nextSibling) {
      // remove date-filter's "no result" message;
      this.listing.parentNode.removeChild(this.listing.nextSibling);
    }
  },

  renderContent: function(event) {
    var headline = event.target.closest('H2');
    if (headline && headline.closest('LI').className === 'headline') {
      if (headline.parentNode.nextSibling) { // if content has already been loaded
        this.toggleHeadline(headline);
      } else {
        var story, contentDiv, detailsDiv, titleLI;
        var storyMarkup = this.buildStoryMarkup(headline, this.data);
        story = storyMarkup.story;
        contentDiv = storyMarkup.contentDiv;
        detailsDiv = storyMarkup.detailsDiv;
        titleLI = storyMarkup.titleLI;
        if (story.relatedStories && story.relatedStories.length) {
          var relatedStories = this.buildRelatedStoryMarkup(story);
          var relatedStoryHeader = relatedStories.header;
          var relatedStoryList = relatedStories.list;
          contentDiv.appendChild(relatedStoryHeader);
          contentDiv.appendChild(relatedStoryList);
        }
        detailsDiv.appendChild(contentDiv);
        detailsDiv.style.display = 'block';
        titleLI.appendChild(detailsDiv);
      }
    } else if (event.target.closest('A') && event.target.closest('A').className == 'related-story-toggle') {
      this.toggleRelatedStoriesDisplay(event);
    } else {
      return;
    }
  },

  toggleHeadline: function(headline) {
    if (headline.parentNode.nextSibling.style.display === 'block') {
      headline.parentNode.nextSibling.style.display = 'none';
    } else {
      headline.parentNode.nextSibling.style.display = 'block';
    }
  },

  buildStoryMarkup: function(headline, data) {
    var titleLI, titleIndex, story, imageUrl, imageElement, contentElement,
      detailsDiv, contentDiv, imageDiv, readmoreElement;
    titleLI = headline.closest('LI');
    titleIndex = [].slice.call(titleLI.parentNode.children).indexOf(titleLI);
    story = data[titleIndex];
    imageUrl = story.image.url;
    imageElement = document.createElement('IMG');
    imageElement.src = imageUrl;
    imageElement.alt = story.titleNoFormatting;
    contentElement = document.createElement('P');
    detailsDiv = document.createElement('DIV');
    contentDiv = document.createElement('DIV');
    contentDiv.setAttribute('class', 'article-content');
    imageDiv = document.createElement('DIV');
    contentElement.innerHTML = story.content;
    readmoreElement = document.createElement('A');
    readmoreElement.appendChild(document.createTextNode(' read more'));
    readmoreElement.href = story.unescapedUrl;
    readmoreElement.target = '_blank';
    contentElement.appendChild(readmoreElement);
    contentDiv.appendChild(contentElement);
    imageDiv.appendChild(imageElement);
    detailsDiv.appendChild(imageDiv);
    return { story, contentDiv, detailsDiv, titleLI };
  },

  buildRelatedStoryMarkup: function(story) {
    var relatedStoryToggle = document.createElement('A');
    relatedStoryToggle.setAttribute('class', 'related-story-toggle');
    var relatedStoryHeader = document.createElement('H3');
    relatedStoryHeader.setAttribute('class', 'related-story-header');
    var toggleText = document.createTextNode('related stories ');
    relatedStoryToggle.appendChild(toggleText);
    var toggleIcon = document.createElement('IMG');
    toggleIcon.src = 'ic_expand_more_black_24px.svg';
    toggleIcon.alt = 'expand';
    relatedStoryToggle.appendChild(toggleIcon);
    relatedStoryHeader.appendChild(relatedStoryToggle);
    var relatedStoryList = document.createElement('UL');
    relatedStoryList.setAttribute('class', 'related-story-list');
    story.relatedStories.forEach(function(relatedStory) {
      var relatedStoryItem = document.createElement('LI');
      var relatedStoryAnchor = document.createElement('A');
      var horizontalLine = document.createElement('HR');
      relatedStoryAnchor.href = relatedStory.unescapedUrl;
      relatedStoryAnchor.target = '_blank';
      relatedStoryAnchor.innerHTML = relatedStory.title;
      relatedStoryItem.appendChild(relatedStoryAnchor);
      relatedStoryItem.appendChild(horizontalLine);
      relatedStoryList.appendChild(relatedStoryItem);
    });
    return { header: relatedStoryHeader, list: relatedStoryList };
  },

  toggleRelatedStoriesDisplay: function(event) {
    var target = event.target.closest('A');
    if (target.parentNode.nextSibling.style.display !== 'block') {
      target.parentNode.nextSibling.style.display = 'block';
      target.querySelector('img').src = 'ic_expand_less_black_24px.svg';
      target.querySelector('img').alt = 'collapse';
    } else {
      target.parentNode.nextSibling.style.display = 'none';
      target.querySelector('img').src = 'ic_expand_more_black_24px.svg';
      target.querySelector('img').alt = 'expand';
    }
  }
};

newsReader.init();
