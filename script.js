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
        xhttp.open("GET", "data.json", true);
        xhttp.send();
    },

    cacheDom: function() {
        this.app = document.getElementById('app');
        this.textFilter = this.app.querySelector('#textFilter');
        this.listing = this.app.querySelector('#articles-listing');
        this.dateFilterForm = this.app.querySelector('#dateFilterForm');
    },

    bindEvents: function() {
        this.listing.addEventListener('click', this.renderContent.bind(this));
        this.textFilter.addEventListener('keyup', this.filterArticlesByKeyword.bind(this));
        this.dateFilterForm.addEventListener('submit', this.filterArticlesByDate.bind(this));
    },

    isValidDate: function(dateString) {
        if (!/^(\d{2}|\d{1})\/(\d{2}|\d{1})\/\d{4}$/.test(dateString))
            return false;
        var parts = dateString.split("/");
        var day = parseInt(parts[1], 10);
        var month = parseInt(parts[0], 10);
        var year = parseInt(parts[2], 10);
        if (year < 1000 || year > 3000 || month === 0 || month > 12)
            return false;
        var monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0))
            monthLength[1] = 29;
        return day > 0 && day <= monthLength[month - 1];
    },

    dispatchClickEvents: function() {

    },

    filterArticlesByKeyword: function(event) {
        this.data = this.reserveData;
        var filterText = event.target.value.trim();
        if (filterText !== "") {
            var filterRE = new RegExp(filterText, 'i');
            this.data = this.reserveData.filter(function(article) {
                return filterRE.test(article.title) || filterRE.test(article.content);
            });
            while (this.listing.firstChild) this.listing.removeChild(this.listing.firstChild);
            this.renderTitles();
        }
    },

    filterArticlesByDate: function(event) {
        event.preventDefault();
        var day, month, year, inputDate;
        day = event.target.querySelector('#date-filter-day').value;
        month = event.target.querySelector('#date-filter-month').value;
        year = event.target.querySelector('#date-filter-year').value;
        if (day.trim() === "" && month.trim() === "" && year.trim() === "") {
            this.data = this.reserveData;
            this.renderTitles();
            return false;
        }
        inputDate = `${day}/${month}/${year}`;
        if (!this.isValidDate(inputDate)) {
            event.target.querySelector('#date-filter-error').style.display = 'inline-block';
            return false;
        }
        var filterDate = new Date(year, month-1, day);
        filterDate.setHours(0, 0, 0, 0);
        this.data = this.reserveData.filter(function(article) {
            articleDate = new Date(article.publishedDate);
            articleDate.setHours(0, 0, 0, 0);
            return filterDate.valueOf() === articleDate.valueOf();
        });
        while (this.listing.firstChild) this.listing.removeChild(this.listing.firstChild);
        this.renderTitles();
    },

    renderTitles: function() {
        // the titles in an each loop
        console.log("let's start rendering");
        console.log(this.data);
        console.log(this.listing);
        var storyItem, titleElement, title;
        this.data.forEach(function(story, index) {
            storyItem = document.createElement('LI');
            // title = document.createTextNode(story.title);
            titleElement = document.createElement('H2');
            titleLink = document.createElement('A');
            titleLink.setAttribute('class', 'title-link');
            titleLink.href = `#title-${index}`;
            titleLink.innerHTML = story.title;
            titleElement.appendChild(titleLink);
            storyItem.appendChild(titleElement);
            storyItem.setAttribute('class', 'headline');
            // console.log(typeof this.listing);


            this.listing.appendChild(storyItem);
            // content = story.content;
            // sourceUrl = story.url;
        }.bind(this));
        // set variables that have been used in the template literals
        // append the template literal to the list
        // console.log(this.data);
        // this.listing.innerHTML = JSON.stringify(this.data);
    },

    renderImage: function() {
        // the title4

    },

    renderContent: function(event) {
        if (event.target.closest('A') && event.target.closest('A').getAttribute('disabled')) {
            return false;
        } else if (event.target.closest('A').className === 'title-link') { //clicking blank space gices some console error
            var story, imageElement, imageUrl, contentElement,
                content, readmoreElement, sourceUrl, iamgeDiv, contentDiv,
                titleLI, titleIndex;
            event.target.closest('A').setAttribute('disabled', true);
            titleLI = event.target.closest('LI');
            //titleLI = event.target.parentNode.parentNode;
            console.log(titleLI);
            titleIndex = [].slice.call(titleLI.parentNode.children).indexOf(titleLI);

            story = this.data[titleIndex];
            //console.log(story);
            imageUrl = story.image.url;
            imageElement = document.createElement('IMG');
            imageElement.src = imageUrl;
            contentElement = document.createElement('P');
            //content = document.createTextNode(story.content);
            contentDiv = document.createElement('DIV');
            contentDiv.setAttribute('class', 'article-content');
            imageDiv = document.createElement('DIV');
            imageDiv.setAttribute('class', 'article-image');
            contentElement.innerHTML = story.content;
            readmoreElement = document.createElement('A');
            readmoreElement.appendChild(document.createTextNode(' read more'));
            readmoreElement.href = story.unescapedUrl;
            readmoreElement.target = '_blank';
            contentElement.appendChild(readmoreElement);
            contentDiv.appendChild(contentElement);
            imageDiv.appendChild(imageElement);

            titleLI.appendChild(imageDiv);

            // console.log(story);
            if (story.relatedStories && story.relatedStories.length > 0) {
                var relatedStoryToggle = document.createElement('A');
                relatedStoryToggle.setAttribute('class', 'related-story-toggle');
                var relatedStoryHeader = document.createElement('H3');
                relatedStoryHeader.setAttribute('class', 'related-story-header');
                var toggleText = document.createTextNode("related stories ");
                relatedStoryToggle.appendChild(toggleText);
                var toggleIcon = document.createElement('IMG');
                toggleIcon.src = "ic_expand_more_black_24px.svg";
                relatedStoryToggle.appendChild(toggleIcon);
                relatedStoryHeader.appendChild(relatedStoryToggle);
                var relatedStoryList = document.createElement('UL');
                relatedStoryList.setAttribute('class', 'related-story-list');
                story.relatedStories.forEach(function(relatedStory) {
                    var relatedStoryItem = document.createElement('LI');
                    var relatedStoryAnchor = document.createElement('A');
                    var horizontalLine = document.createElement('HR')
                    relatedStoryAnchor.href = relatedStory.unescapedUrl;
                    relatedStoryAnchor.target = '_blank';
                    relatedStoryAnchor.innerHTML = relatedStory.title;
                    relatedStoryItem.appendChild(relatedStoryAnchor);
                    relatedStoryItem.appendChild(horizontalLine);
                    relatedStoryList.appendChild(relatedStoryItem);

                });
                contentDiv.appendChild(relatedStoryHeader);
                contentDiv.appendChild(relatedStoryList);

            }
            titleLI.appendChild(contentDiv);
        } else if (event.target.closest('A').className == "related-story-toggle") {
            var target = event.target.closest('A');
            if (target.parentNode.nextSibling.style.display !== "block") {
                console.log(target.className);
                console.log(target.parentNode.nextSibling.className);
                target.parentNode.nextSibling.style.display = "block";
                console.log(target.querySelector('img'));
                target.querySelector('img').src = 'ic_expand_less_black_24px.svg';
            } else {
                target.parentNode.nextSibling.style.display = "none";
                target.querySelector('img').src = 'ic_expand_more_black_24px.svg';
                console.log(target.querySelector('img'));
            }
        } else {
            console.log(event.target);
        }
    },


    renderRelatedStories: function() {

    },

};

newsReader.init();
