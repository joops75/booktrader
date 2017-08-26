'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ApiResponse; // must be defined globally to work
var pathname = window.location.pathname;
var bookTableColumns = 4;
var messageLocation;
var myBooksStyle;
pathname === '/myBooks' ? myBooksStyle = { display: '' } : myBooksStyle = { display: 'none' };
var notMyBooksStyle;
pathname !== '/myBooks' ? notMyBooksStyle = { display: '' } : notMyBooksStyle = { display: 'none' };
var searchBooksStyle;
pathname === '/searchBooks' ? searchBooksStyle = { display: '' } : searchBooksStyle = { display: 'none' };

var DisplayBooks = function (_React$Component) {
  _inherits(DisplayBooks, _React$Component);

  function DisplayBooks(props) {
    _classCallCheck(this, DisplayBooks);

    var _this = _possibleConstructorReturn(this, (DisplayBooks.__proto__ || Object.getPrototypeOf(DisplayBooks)).call(this, props));

    _this.state = {
      users: []
    };
    _this.input = _this.input.bind(_this);
    _this.clickSearch = _this.clickSearch.bind(_this);
    _this.requestBook = _this.requestBook.bind(_this);
    _this.cancelRequest = _this.cancelRequest.bind(_this);
    _this.acceptRequest = _this.acceptRequest.bind(_this);
    _this.rejectRequest = _this.rejectRequest.bind(_this);
    _this.cancelLoan = _this.cancelLoan.bind(_this);
    _this.deleteBook = _this.deleteBook.bind(_this);
    return _this;
  }

  _createClass(DisplayBooks, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      var _this2 = this;

      if (pathname === '/searchBooks') {
        var searchFilterArray = [{ 'local.username': username }, { 'local.city': city, 'local.state': state, 'local.country': country }]; // don't forget logged in user!
        $.post('/api/filteredSearch', { searchFilterArray: searchFilterArray }, function (info, status) {
          _this2.getOrUpdateBooks(info);
        });
      } else {
        this.getMeAndRelatedUsers();
      }
    }
  }, {
    key: 'getMeAndRelatedUsers',
    value: function getMeAndRelatedUsers() {
      var _this3 = this;

      $.get('/api/getMyBooks', function (data, status) {
        var userA = data[0];
        var usernames = [];
        for (var i = 0; i < userA.local.borrowingFrom.length; i++) {
          usernames.push(userA.local.borrowingFrom[i].local.username);
        }
        for (var _i = 0; _i < userA.local.requestsTo.length; _i++) {
          usernames.push(userA.local.requestsTo[_i].local.username);
        }
        for (var _i2 = 0; _i2 < userA.local.books.length; _i2++) {
          if (userA.local.books[_i2].lendingTo) usernames.push(userA.local.books[_i2].lendingTo.local.username);
          if (userA.local.books[_i2].requestsFrom) {
            for (var j = 0; j < userA.local.books[_i2].requestsFrom.length; j++) {
              usernames.push(userA.local.books[_i2].requestsFrom[j].local.username);
            }
          }
        }
        var uniqueUsernames = usernames.filter(function (elem, index, self) {
          return index === self.indexOf(elem);
        });
        var searchFilterArray = [];
        searchFilterArray.push({ 'local.username': username }); // don't forget logged in user!
        for (var _i3 = 0; _i3 < uniqueUsernames.length; _i3++) {
          var searchFilter = {};
          searchFilter['local.username'] = uniqueUsernames[_i3];
          searchFilterArray.push(searchFilter);
        }
        $.post('/api/filteredSearch', { searchFilterArray: searchFilterArray }, function (info, status) {
          getBooks(info);
        });
      });
      var getBooks = function getBooks(users) {
        _this3.getOrUpdateBooks(users);
      };
    }
  }, {
    key: 'getUserBooks',
    value: function getUserBooks(user_name) {
      var _this4 = this;

      $.ajax({
        url: '/api/getUserBooks',
        type: 'POST',
        dataType: 'JSON', //specifies the expected response data type which is used as an argument in the 'success' function
        data: { username: user_name },
        success: function success(users) {
          _this4.getOrUpdateBooks(users);
        }
      });
    }
  }, {
    key: 'getOrUpdateBooks',
    value: function getOrUpdateBooks(users) {
      this.setState({
        users: users
      });
    }
  }, {
    key: 'getOrUpdateOneBook',
    value: function getOrUpdateOneBook(user) {
      var userIndex = this.findUserIndex(username);
      var users = JSON.parse(JSON.stringify(this.state.users));
      users.splice(userIndex, 1);
      users.splice(userIndex, 0, user);
      this.setState({
        users: users
      });
    }
  }, {
    key: 'addBook',
    value: function addBook() {
      var _this5 = this;

      var enteredIsbn = $('#bookSearchBox')[0].value;
      var isbn = enteredIsbn.replace(/[^0-9a-z]/gi, '').toUpperCase();
      $('#bookSearchBox')[0].value = '';
      var user = this.findUser(username);
      var userStringifiedOriginal = JSON.stringify(user);
      var isbns = user.local.isbns;
      if (!enteredIsbn) {
        this.displayMessage('book ISBN field empty!');
      } else if (isbn.length < 10) {
        // ISBNs have either 10 or 13 characters
        this.displayMessage('ISBN too short!');
      } else if (isbns.indexOf(isbn) !== -1) {
        this.displayMessage('book already added!');
      } else {
        this.callApi(isbn);
      }
      ApiResponse = function ApiResponse(data) {
        var key = 'ISBN:' + isbn;
        if (!data[key]) {
          _this5.displayMessage('ISBN not found!');
        } else {
          var book = data[key];
          user.local.books.push(book);
          user.local.isbns.push(isbn);
          _this5.updateOneUser(user, userStringifiedOriginal);
        }
      };
    }
  }, {
    key: 'updateOneUser',
    value: function updateOneUser(user, userStringifiedOriginal) {
      var _this6 = this;

      $.post('/api/updateOneUser', {
        user: user, // any empty arrays in data will be removed from req.body
        userStringifiedOriginal: userStringifiedOriginal
      }, function (data, status) {
        if (typeof data === 'string') {
          _this6.displayMessage(data);
        } else {
          _this6.getOrUpdateOneBook(data);
        }
      });
    }
  }, {
    key: 'displayMessage',
    value: function displayMessage(message) {
      var selector;
      messageLocation ? selector = $('#message_' + messageLocation) : selector = $('#message');
      selector[0].textContent = message;
      selector.css('visibility', 'visible');
      selector.fadeOut(3000, function () {
        //function actions performed AFTER fadeOut
        selector.css('display', '');
        selector.css('visibility', 'hidden');
      });
    }
  }, {
    key: 'callApi',
    value: function callApi(isbn) {
      var src = "https://openlibrary.org/api/books?bibkeys=ISBN:" + isbn + "&jscmd=data&callback=ApiResponse";
      $('<script>').attr({ 'id': 'callApi', 'src': src }).appendTo('head'); // can append to head or body, after which api is automatically called
      $('#callApi').remove();
    }
  }, {
    key: 'filteredSearch',
    value: function filteredSearch() {
      var _this7 = this;

      var cityName = $('#city')[0].value.toUpperCase();
      var stateName = $('#state')[0].value.toUpperCase();
      var countryName = $('#country')[0].value.toUpperCase();
      // set mongoose search filter object
      var searchFilter = {};
      if (cityName) searchFilter['local.city'] = cityName;
      if (stateName) searchFilter['local.state'] = stateName;
      if (countryName) searchFilter['local.country'] = countryName;
      var searchFilterArray = [];
      searchFilterArray.push({ 'local.username': username }, searchFilter); // don't forget logged in user!
      $.ajax({
        url: '/api/filteredSearch',
        type: 'POST',
        dataType: 'JSON', //specifies the expected response data type which is used as an argument in the 'success' function
        data: {
          searchFilterArray: searchFilterArray
        },
        success: function success(users) {
          updateBooks(users);
        }
      });
      var updateBooks = function updateBooks(users) {
        _this7.getOrUpdateBooks(users);
      };
    }
  }, {
    key: 'input',
    value: function input(e) {
      messageLocation = null;
      if (e.which === 13) {
        if (e.target.id === 'bookSearchBox') {
          this.addBook();
        } else {
          this.filteredSearch();
        }
      }
    }
  }, {
    key: 'clickSearch',
    value: function clickSearch(e) {
      messageLocation = null;
      if (e.target.id === 'bookSearchButton') {
        this.addBook();
      } else {
        this.filteredSearch();
      }
    }
  }, {
    key: 'requestBook',
    value: function requestBook(e) {
      var details = e.target.id.split('_');
      var owner = details[1]; // = userB.local.username
      var userBIndex = details[2];
      var bookIndex = details[3];
      messageLocation = userBIndex + '_' + bookIndex;
      var userB = this.findUser(owner);
      var userBStringifiedOriginal = JSON.stringify(userB);
      var userA = this.findUser(username);
      var userAStringifiedOriginal = JSON.stringify(userA);
      var isbn = userB.local.isbns[bookIndex];
      var requestsToIndex = this.findLocalIndex(owner, userA.local.requestsTo);
      if (requestsToIndex === -1) {
        userA.local.requestsTo.push(this.userObject(owner));
        userA.local.requestsTo[userA.local.requestsTo.length - 1].local.isbns = [isbn];
      } else {
        userA.local.requestsTo[requestsToIndex].local.isbns.push(isbn);
      }
      var userAObject = this.userObject(username);
      userB.local.books[bookIndex].requestsFrom ? userB.local.books[bookIndex].requestsFrom.push(userAObject) : userB.local.books[bookIndex].requestsFrom = [userAObject];
      var userAIndex = this.findUserIndex(username);
      this.updateTwoUsers(userA, userAStringifiedOriginal, userAIndex, userB, userBStringifiedOriginal, userBIndex);
    }
  }, {
    key: 'cancelRequest',
    value: function cancelRequest(e) {
      var details = e.target.id.split('_');
      var owner = details[1]; // = userB.local.username
      var userBIndex = details[2];
      var bookIndex = details[3];
      messageLocation = userBIndex + '_' + bookIndex;
      var userB = this.findUser(owner);
      var userBStringifiedOriginal = JSON.stringify(userB);
      var isbn = userB.local.isbns[bookIndex];
      var userA = this.findUser(username);
      var userAStringifiedOriginal = JSON.stringify(userA);
      // depopulate requestsTo array
      var requestsToArr = userA.local.requestsTo;
      var requestsToIndex = this.findLocalIndex(owner, requestsToArr);
      if (userA.local.requestsTo[requestsToIndex].local.isbns.length > 1) {
        // state should be modified after updateTwoUsers called
        var isbnIndex = userA.local.requestsTo[requestsToIndex].local.isbns.indexOf(isbn);
        userA.local.requestsTo[requestsToIndex].local.isbns.splice(isbnIndex, 1);
      } else {
        userA.local.requestsTo.splice(requestsToIndex, 1);
      }
      var requestsFromArr = userB.local.books[bookIndex].requestsFrom;
      userB.local.books[bookIndex].requestsFrom.splice(this.findLocalIndex(username, requestsFromArr), 1);
      var userAIndex = this.findUserIndex(username);
      this.updateTwoUsers(userA, userAStringifiedOriginal, userAIndex, userB, userBStringifiedOriginal, userBIndex);
    }
  }, {
    key: 'findUserIndex',
    value: function findUserIndex(user_name) {
      var users = this.state.users;
      for (var i = 0; i < users.length; i++) {
        if (users[i].local.username === user_name) {
          return i;
        }
      }
      return null;
    }
  }, {
    key: 'findUser',
    value: function findUser(user_name) {
      var users = JSON.parse(JSON.stringify(this.state.users));
      for (var i = 0; i < users.length; i++) {
        if (users[i].local.username === user_name) {
          return users[i];
        }
      }
      return null;
    }
  }, {
    key: 'userObject',
    value: function userObject(user_name) {
      var user = this.findUser(user_name);
      return {
        local: {
          firstName: user.local.firstName,
          lastName: user.local.lastName,
          username: user.local.username,
          city: user.local.city,
          state: user.local.state,
          country: user.local.country,
          email: user.local.email
        }
      };
    }
  }, {
    key: 'updateTwoUsers',
    value: function updateTwoUsers(userA, userAStringifiedOriginal, userAIndex, userB, userBStringifiedOriginal, userBIndex) {
      var _this8 = this;

      var users = JSON.parse(JSON.stringify(this.state.users));
      $.post('/api/updateTwoUsers', {
        userA: userA,
        userAStringifiedOriginal: userAStringifiedOriginal,
        userB: userB,
        userBStringifiedOriginal: userBStringifiedOriginal
      }, function (data, status) {
        if (typeof data === 'string') {
          _this8.displayMessage(data);
        } else {
          var dataA = data[0];
          var dataB = data[1];
          users.splice(userAIndex, 1);
          users.splice(userAIndex, 0, dataA);
          users.splice(userBIndex, 1);
          users.splice(userBIndex, 0, dataB);
          _this8.getOrUpdateBooks(users);
        }
      });
    }
  }, {
    key: 'findLocalIndex',
    value: function findLocalIndex(user_name, localArr) {
      for (var i = 0; i < localArr.length; i++) {
        if (localArr[i].local.username === user_name) {
          return i;
        }
      }
      return -1;
    }
  }, {
    key: 'acceptRequest',
    value: function acceptRequest(e) {
      var arr = e.target.id.split('_');
      var requester = arr[1];
      var isbn = arr[2];
      var bookIndex = arr[3];
      var userA = this.findUser(username);
      var userAStringifiedOriginal = JSON.stringify(userA);
      var requestsFromArr = userA.local.books[bookIndex].requestsFrom;
      var lendingToObject = userA.local.books[bookIndex].requestsFrom.splice(this.findLocalIndex(requester, requestsFromArr), 1)[0];
      userA.local.books[bookIndex].lendingTo = lendingToObject;
      var userB = this.findUser(requester);
      var userBStringifiedOriginal = JSON.stringify(userB);
      // populate borrowingFrom array
      var borrowingFromArr = userB.local.borrowingFrom;
      var borrowingFromIndex = this.findLocalIndex(username, borrowingFromArr);
      if (borrowingFromIndex === -1) {
        userB.local.borrowingFrom.push(this.userObject(username));
        userB.local.borrowingFrom[borrowingFromArr.length - 1].local.isbns = [isbn];
      } else {
        userB.local.borrowingFrom[borrowingFromIndex].local.isbns.push(isbn);
      }
      // depopulate requestsTo array
      var requestsToArr = userB.local.requestsTo;
      var requestsToIndex = this.findLocalIndex(username, requestsToArr);
      if (userB.local.requestsTo[requestsToIndex].local.isbns.length > 1) {
        var isbnIndex = userB.local.requestsTo[requestsToIndex].local.isbns.indexOf(isbn);
        userB.local.requestsTo[requestsToIndex].local.isbns.splice(isbnIndex, 1);
      } else {
        userB.local.requestsTo.splice(requestsToIndex, 1);
      }
      var userAIndex = this.findUserIndex(username);
      var userBIndex = this.findUserIndex(requester);
      messageLocation = userAIndex + '_' + bookIndex;
      this.updateTwoUsers(userA, userAStringifiedOriginal, userAIndex, userB, userBStringifiedOriginal, userBIndex);
    }
  }, {
    key: 'rejectRequest',
    value: function rejectRequest(e) {
      var arr = e.target.id.split('_');
      var requester = arr[1];
      var isbn = arr[2];
      var bookIndex = arr[3];
      var userA = this.findUser(username);
      var userAStringifiedOriginal = JSON.stringify(userA);
      var requestsFromArr = userA.local.books[bookIndex].requestsFrom;
      userA.local.books[bookIndex].requestsFrom.splice(this.findLocalIndex(requester, requestsFromArr), 1);
      var userB = this.findUser(requester);
      var userBStringifiedOriginal = JSON.stringify(userB);
      // depopulate requestsTo array
      var requestsToArr = userB.local.requestsTo;
      var requestsToIndex = this.findLocalIndex(username, requestsToArr);
      if (userB.local.requestsTo[requestsToIndex].local.isbns.length > 1) {
        var isbnIndex = userB.local.requestsTo[requestsToIndex].local.isbns.indexOf(isbn);
        userB.local.requestsTo[requestsToIndex].local.isbns.splice(isbnIndex, 1);
      } else {
        userB.local.requestsTo.splice(requestsToIndex, 1);
      }
      var userAIndex = this.findUserIndex(username);
      var userBIndex = this.findUserIndex(requester);
      messageLocation = userAIndex + '_' + bookIndex;
      this.updateTwoUsers(userA, userAStringifiedOriginal, userAIndex, userB, userBStringifiedOriginal, userBIndex);
    }
  }, {
    key: 'cancelLoan',
    value: function cancelLoan(e) {
      var arr = e.target.id.split('_');
      var borrower = arr[1];
      var isbn = arr[2];
      var bookIndex = arr[3];
      var userA = this.findUser(username);
      var userAStringifiedOriginal = JSON.stringify(userA);
      userA.local.books[bookIndex].lendingTo = {};
      var userB = this.findUser(borrower);
      var userBStringifiedOriginal = JSON.stringify(userB);
      // depopulate borrowingFrom array
      var borrowingFromArr = userB.local.borrowingFrom;
      var borrowingFromIndex = this.findLocalIndex(username, borrowingFromArr);
      if (userB.local.borrowingFrom[borrowingFromIndex].local.isbns.length > 1) {
        var isbnIndex = userB.local.borrowingFrom[borrowingFromIndex].local.isbns.indexOf(isbn);
        userB.local.borrowingFrom[borrowingFromIndex].local.isbns.splice(isbnIndex, 1);
      } else {
        userB.local.borrowingFrom.splice(borrowingFromIndex, 1);
      }
      var userAIndex = this.findUserIndex(username);
      var userBIndex = this.findUserIndex(borrower);
      messageLocation = userAIndex + '_' + bookIndex;
      this.updateTwoUsers(userA, userAStringifiedOriginal, userAIndex, userB, userBStringifiedOriginal, userBIndex);
    }
  }, {
    key: 'deleteBook',
    value: function deleteBook(e) {
      var arr = e.target.id.split('_');
      var isbn = arr[1];
      var bookIndex = arr[2];
      var user = this.findUser(username);
      var userStringifiedOriginal = JSON.stringify(user);
      user.local.isbns.splice(bookIndex, 1);
      user.local.books.splice(bookIndex, 1);
      this.updateOneUser(user, userStringifiedOriginal);
      var userAIndex = this.findUserIndex(username);
      messageLocation = userAIndex + '_' + bookIndex;
    }
  }, {
    key: 'render',
    value: function render() {
      var me = this.state.users[this.findUserIndex(username)];
      if (!(pathname === '/myRequestsAndBorrowings' && me && me.local.requestsTo.length === 0 && me.local.borrowingFrom.length === 0)) {
        return React.createElement(
          'div',
          { className: 'frame', style: { paddingTop: '0px' } },
          React.createElement(
            'div',
            { className: 'page' },
            React.createElement(
              'div',
              { className: 'formBox' },
              React.createElement(
                'h5',
                { style: myBooksStyle },
                'Add books I own and want to loan out to my collection:'
              ),
              React.createElement(
                'h5',
                { style: searchBooksStyle },
                'Search for books in:'
              ),
              React.createElement('input', { id: 'bookSearchBox', className: 'bookSearchInput', type: 'text', placeholder: 'Enter book ISBN', style: myBooksStyle, onKeyDown: this.input }),
              React.createElement(
                'button',
                { id: 'bookSearchButton', style: myBooksStyle, onClick: this.clickSearch },
                'Add book'
              ),
              React.createElement(
                'div',
                { style: myBooksStyle },
                React.createElement(
                  'div',
                  { id: 'message', style: { visibility: 'hidden' } },
                  'Filler'
                )
              ),
              React.createElement('input', { id: 'city', className: 'bookSearchInput', type: 'text', placeholder: 'Enter city', defaultValue: city, style: searchBooksStyle, onKeyDown: this.input }),
              React.createElement('input', { id: 'state', className: 'bookSearchInput', type: 'text', placeholder: 'Enter state', defaultValue: state, style: searchBooksStyle, onKeyDown: this.input }),
              React.createElement('input', { id: 'country', className: 'bookSearchInput', type: 'text', placeholder: 'Enter country', defaultValue: country, style: searchBooksStyle, onKeyDown: this.input }),
              React.createElement(
                'button',
                { id: 'filteredSearchButton', style: searchBooksStyle, onClick: this.clickSearch },
                'Search'
              ),
              React.createElement(Users, { users: this.state.users, requestBook: this.requestBook, cancelRequest: this.cancelRequest, acceptRequest: this.acceptRequest, rejectRequest: this.rejectRequest, cancelLoan: this.cancelLoan, deleteBook: this.deleteBook })
            )
          )
        );
      } else {
        return React.createElement(
          'div',
          { className: 'frame', style: { paddingTop: '0px' } },
          React.createElement(
            'div',
            { className: 'page' },
            React.createElement(
              'div',
              { className: 'formBox' },
              React.createElement(
                'div',
                null,
                'Nothing to display'
              )
            )
          )
        );
      }
    }
  }]);

  return DisplayBooks;
}(React.Component);

var Users = function Users(props) {
  var users = props.users.map(function (user, i) {
    return React.createElement(BookRows, { key: i, userIndex: i, user: user, requestBook: props.requestBook, cancelRequest: props.cancelRequest, acceptRequest: props.acceptRequest, rejectRequest: props.rejectRequest, cancelLoan: props.cancelLoan, deleteBook: props.deleteBook });
  });
  return React.createElement(
    'table',
    null,
    users
  );
};

var BookRows = function BookRows(props) {
  var totalUserBooks = props.user.local.books.length;
  var books = [];
  var bookRow = [];
  for (var i = 0; i < totalUserBooks; i++) {
    var book = props.user.local.books[i];
    bookRow.push(book);
    if (bookRow.length === bookTableColumns || i === totalUserBooks - 1) {
      books.push(bookRow);
      bookRow = [];
    }
  }
  var bookRows = books.map(function (row, i) {
    return React.createElement(Books, { key: props.userIndex + '_' + i, userIndex: props.userIndex, row: row, rowIndex: i, user: props.user, requestBook: props.requestBook, cancelRequest: props.cancelRequest, acceptRequest: props.acceptRequest, rejectRequest: props.rejectRequest, cancelLoan: props.cancelLoan, deleteBook: props.deleteBook });
  });
  return React.createElement(
    'tbody',
    null,
    bookRows
  );
};

var Books = function Books(props) {
  var books = props.row.map(function (book, i) {
    var isbn = props.user.local.isbns[props.rowIndex * bookTableColumns + i];
    var src;
    book.cover ? src = book.cover.medium : src = '/public/images/NoImageAvailable.png';
    var requestsFromUsernameFound = false;
    if (book.requestsFrom) {
      for (var _i4 = 0; _i4 < book.requestsFrom.length; _i4++) {
        if (book.requestsFrom[_i4].local.username === username) {
          requestsFromUsernameFound = true;
          break;
        }
      }
    }
    var lendingToUsernameFound;
    !book.lendingTo ? lendingToUsernameFound = false : book.lendingTo.local.username === username ? lendingToUsernameFound = true : lendingToUsernameFound = false;
    var combinedStyle;
    pathname === '/searchBooks' && props.user.local.username === username || pathname === '/myBooks' && props.user.local.username !== username || pathname === '/myRequestsAndBorrowings' && !requestsFromUsernameFound && !lendingToUsernameFound ? combinedStyle = { display: 'none' } : combinedStyle = { display: '' };
    var requestButtonStyle;
    props.user.local.username !== username && !requestsFromUsernameFound && !lendingToUsernameFound ? requestButtonStyle = { display: '' } : requestButtonStyle = { display: 'none' };
    var cancelRequestButtonStyle;
    requestsFromUsernameFound ? cancelRequestButtonStyle = { display: '' } : cancelRequestButtonStyle = { display: 'none' };
    var onLoanToInfo;
    book.lendingTo ? onLoanToInfo = book.lendingTo.local.username + ' from ' + book.lendingTo.local.city + ', ' + book.lendingTo.local.state + ', ' + book.lendingTo.local.country + '.' : onLoanToInfo = 'No one';
    var displayedEmail;
    book.lendingTo ? displayedEmail = book.lendingTo.local.email : '';
    var onLoanToEmailDisplayStyle;
    pathname === '/myBooks' && onLoanToInfo !== 'No one' ? onLoanToEmailDisplayStyle = { display: '' } : onLoanToEmailDisplayStyle = { display: 'none' };
    var onLoanInfo;
    book.lendingTo ? onLoanInfo = 'Yes' : onLoanInfo = 'No';
    var ownerDetailsDisplayStyle;
    pathname === '/myRequestsAndBorrowings' && book.lendingTo ? ownerDetailsDisplayStyle = { display: '' } : ownerDetailsDisplayStyle = { display: 'none' };
    var requestsFromCount;
    book.requestsFrom ? requestsFromCount = book.requestsFrom.length : requestsFromCount = '0';
    var cancelLoanButtonStyle;
    book.lendingTo && props.user.local.username === username ? cancelLoanButtonStyle = { display: '' } : cancelLoanButtonStyle = { display: 'none' };
    var cancelLoanButtonId;
    book.lendingTo ? cancelLoanButtonId = 'cancelLoan_' + book.lendingTo.local.username + '_' + isbn + '_' + (props.rowIndex * bookTableColumns + i) : cancelLoanButtonId = '';
    var deleteBookButtonStyle;
    props.user.local.username === username && !book.lendingTo && !book.requestsFrom ? deleteBookButtonStyle = { display: '' } : deleteBookButtonStyle = { display: 'none' };
    return React.createElement(
      'td',
      { key: props.userIndex + '_' + props.rowIndex + '_' + i, style: combinedStyle },
      React.createElement('img', { src: src }),
      React.createElement(
        'div',
        null,
        'Title: ',
        React.createElement(
          'a',
          { href: book.url, target: '_blank' },
          React.createElement(
            'span',
            null,
            book.title
          )
        )
      ),
      React.createElement(
        'div',
        null,
        'Author: ',
        React.createElement(
          'a',
          { href: book.authors[0].url, target: '_blank' },
          React.createElement(
            'span',
            null,
            book.authors[0].name
          )
        )
      ),
      React.createElement(
        'div',
        null,
        'Location: ',
        props.user.local.city,
        ', ',
        props.user.local.state,
        ', ',
        props.user.local.country
      ),
      React.createElement(
        'div',
        { style: ownerDetailsDisplayStyle },
        'Owner: ',
        props.user.local.username
      ),
      React.createElement(
        'div',
        { style: ownerDetailsDisplayStyle },
        'Email: ',
        props.user.local.email
      ),
      React.createElement(
        'div',
        { id: 'message_' + props.userIndex + '_' + (props.rowIndex * bookTableColumns + i), className: 'bookMessage', style: { visibility: 'hidden' } },
        'Filler'
      ),
      React.createElement(
        'div',
        null,
        'Requesters:'
      ),
      React.createElement(
        'div',
        { style: myBooksStyle },
        React.createElement(RequestsFrom, { book: book, isbn: isbn, bookIndex: props.rowIndex * bookTableColumns + i, acceptRequest: props.acceptRequest, rejectRequest: props.rejectRequest })
      ),
      React.createElement(
        'div',
        { style: notMyBooksStyle },
        '(',
        requestsFromCount,
        ')'
      ),
      React.createElement(
        'button',
        { id: 'requestBook_' + props.user.local.username + '_' + props.userIndex + '_' + (props.rowIndex * bookTableColumns + i), style: requestButtonStyle, onClick: props.requestBook },
        'Request this book'
      ),
      React.createElement(
        'button',
        { id: 'cancelRequest_' + props.user.local.username + '_' + props.userIndex + '_' + (props.rowIndex * bookTableColumns + i), style: cancelRequestButtonStyle, onClick: props.cancelRequest },
        'Cancel request'
      ),
      React.createElement(
        'div',
        { style: myBooksStyle },
        'On loan to:',
        React.createElement(
          'div',
          null,
          onLoanToInfo,
          React.createElement(
            'div',
            { style: onLoanToEmailDisplayStyle },
            ' Email: ',
            displayedEmail,
            '.'
          )
        )
      ),
      React.createElement(
        'div',
        { style: notMyBooksStyle },
        'On loan:',
        React.createElement(
          'div',
          null,
          onLoanInfo
        )
      ),
      React.createElement(
        'button',
        { id: cancelLoanButtonId, style: cancelLoanButtonStyle, onClick: props.cancelLoan },
        'Cancel loan'
      ),
      React.createElement(
        'button',
        { id: 'deleteBook_' + isbn + '_' + (props.rowIndex * bookTableColumns + i), style: deleteBookButtonStyle, onClick: props.deleteBook },
        'Delete book'
      )
    );
  });
  return React.createElement(
    'tr',
    null,
    books
  );
};

var RequestsFrom = function RequestsFrom(props) {
  if (props.book.requestsFrom) {
    var requestsFrom = props.book.requestsFrom.map(function (requester, i) {
      var acceptRequestIconStyle;
      props.book.lendingTo ? acceptRequestIconStyle = { display: 'none' } : acceptRequestIconStyle = { display: '' };
      return React.createElement(
        'div',
        { key: 'requestsFrom' + '_' + props.userIndex + '_' + props.bookIndex + '_' + i },
        requester.local.username,
        ' from ',
        requester.local.city,
        ', ',
        requester.local.state,
        ', ',
        requester.local.country,
        '.',
        React.createElement(
          'div',
          { style: myBooksStyle },
          ' Email: ',
          requester.local.email,
          '.'
        ),
        ' ',
        React.createElement('i', { id: 'accept_' + requester.local.username + '_' + props.isbn + '_' + props.bookIndex, className: 'fa fa-check', style: acceptRequestIconStyle, onClick: props.acceptRequest }),
        React.createElement('i', { id: 'reject_' + requester.local.username + '_' + props.isbn + '_' + props.bookIndex, className: 'fa fa-remove', onClick: props.rejectRequest })
      );
    });
    return React.createElement(
      'div',
      null,
      requestsFrom
    );
  } else {
    return React.createElement(
      'div',
      null,
      'No one'
    );
  }
};

ReactDOM.render(React.createElement(DisplayBooks, null), document.getElementById('target'));
//# sourceMappingURL=books-babel.js.map
