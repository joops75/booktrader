var ApiResponse // must be defined globally to work
var pathname = window.location.pathname
var bookTableColumns = 4
var messageLocation
var myBooksStyle
pathname === '/myBooks' ? myBooksStyle = {display: ''} : myBooksStyle = {display: 'none'}
var notMyBooksStyle
pathname !== '/myBooks' ? notMyBooksStyle = {display: ''} : notMyBooksStyle = {display: 'none'}
var searchBooksStyle
pathname === '/searchBooks' ? searchBooksStyle = {display: ''} : searchBooksStyle = {display: 'none'}

class DisplayBooks extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      users: []
    }
    this.input = this.input.bind(this)
    this.clickSearch = this.clickSearch.bind(this)
    this.requestBook = this.requestBook.bind(this)
    this.cancelRequest = this.cancelRequest.bind(this)
    this.acceptRequest = this.acceptRequest.bind(this)
    this.rejectRequest = this.rejectRequest.bind(this)
    this.cancelLoan = this.cancelLoan.bind(this)
    this.deleteBook = this.deleteBook.bind(this)
  }
  componentWillMount() {
    if (pathname === '/searchBooks') {
      var searchFilterArray = [{ 'local.username': username }, { 'local.city': city, 'local.state': state, 'local.country': country }] // don't forget logged in user!
      $.post('/api/filteredSearch', { searchFilterArray: searchFilterArray }, (info, status) => {
        this.getOrUpdateBooks(info)
      })
    }
    else {
      this.getMeAndRelatedUsers()
    }
  }
  getMeAndRelatedUsers() {
    $.get('/api/getMyBooks', function(data, status) {
      var userA = data[0]
      var usernames = []
      for (let i = 0; i < userA.local.borrowingFrom.length; i++) {
        usernames.push(userA.local.borrowingFrom[i].local.username)
      }
      for (let i = 0; i < userA.local.requestsTo.length; i++) {
        usernames.push(userA.local.requestsTo[i].local.username)
      }
      for (let i = 0; i < userA.local.books.length; i++) {
        if (userA.local.books[i].lendingTo) usernames.push(userA.local.books[i].lendingTo.local.username)
        if (userA.local.books[i].requestsFrom) {
          for (let j = 0; j < userA.local.books[i].requestsFrom.length; j++) {
            usernames.push(userA.local.books[i].requestsFrom[j].local.username)
          }
        }
      }
      var uniqueUsernames = usernames.filter(function(elem, index, self) {
        return index === self.indexOf(elem);
      })
      var searchFilterArray = []
      searchFilterArray.push({ 'local.username': username }) // don't forget logged in user!
      for (let i = 0; i < uniqueUsernames.length; i++) {
        var searchFilter = {}
        searchFilter['local.username'] = uniqueUsernames[i]
        searchFilterArray.push(searchFilter)
      }
      $.post('/api/filteredSearch', { searchFilterArray: searchFilterArray }, function(info, status) {
        getBooks(info)
      })
    })
    var getBooks = (users) => {
      this.getOrUpdateBooks(users)
    }
  }
  getUserBooks(user_name) {
    $.ajax({
      url: '/api/getUserBooks',
      type: 'POST',
      dataType: 'JSON', //specifies the expected response data type which is used as an argument in the 'success' function
      data: {username: user_name},
      success: (users) => {
        this.getOrUpdateBooks(users)
      }
    })
  }
  getOrUpdateBooks(users) {
    this.setState({
      users: users
    })
  }
  getOrUpdateOneBook(user) {
    var userIndex = this.findUserIndex(username)
    var users = JSON.parse(JSON.stringify(this.state.users))
    users.splice(userIndex, 1)
    users.splice(userIndex, 0, user)
    this.setState({
      users: users
    })
  }
  addBook() {
    var enteredIsbn = $('#bookSearchBox')[0].value
    var isbn = enteredIsbn.replace(/[^0-9a-z]/gi, '').toUpperCase()
    $('#bookSearchBox')[0].value = ''
    var user = this.findUser(username)
    var userStringifiedOriginal = JSON.stringify(user)
    var isbns = user.local.isbns
    if (!enteredIsbn) {
      this.displayMessage('book ISBN field empty!')
    } else if (isbn.length < 10) {// ISBNs have either 10 or 13 characters
      this.displayMessage('ISBN too short!')
    } else if (isbns.indexOf(isbn) !== -1) {
      this.displayMessage('book already added!')
    } else {
      this.callApi(isbn)
    }
    ApiResponse = (data) => {
      var key = 'ISBN:' + isbn
      if (!data[key]) {
        this.displayMessage('ISBN not found!')
      } else {
        var book = data[key]
        user.local.books.push(book)
        user.local.isbns.push(isbn)
        this.updateOneUser(user, userStringifiedOriginal)
      }
    }
  }
  updateOneUser(user, userStringifiedOriginal) {
    $.post('/api/updateOneUser', {
      user: user, // any empty arrays in data will be removed from req.body
      userStringifiedOriginal: userStringifiedOriginal
    },
    (data, status) => {
      if (typeof data === 'string') {
        this.displayMessage(data)
      } else {
        this.getOrUpdateOneBook(data)
      }
    })
  }
  displayMessage(message) {
    var selector
    messageLocation ? selector = $('#message_' + messageLocation) : selector = $('#message')
    selector[0].textContent = message
    selector.css('visibility', 'visible')
    selector.fadeOut(3000, function() {//function actions performed AFTER fadeOut
      selector.css('display', '')
      selector.css('visibility', 'hidden')
    })
  }
  callApi(isbn) {
    var src = "https://openlibrary.org/api/books?bibkeys=ISBN:" + isbn + "&jscmd=data&format=json&callback=ApiResponse"
    $('<script>').attr({'id': 'callApi', 'src': src}).appendTo('head') // can append to head or body, after which api is automatically called
    $('#callApi').remove()
  }
  filteredSearch() {
    var cityName = $('#city')[0].value.toUpperCase()
    var stateName = $('#state')[0].value.toUpperCase()
    var countryName = $('#country')[0].value.toUpperCase()
    // set mongoose search filter object
    var searchFilter = {}
    if (cityName) searchFilter['local.city'] = cityName
    if (stateName) searchFilter['local.state'] = stateName
    if (countryName) searchFilter['local.country'] = countryName
    var searchFilterArray = []
    searchFilterArray.push({ 'local.username': username }, searchFilter ) // don't forget logged in user!
    $.ajax({
      url: '/api/filteredSearch',
      type: 'POST',
      dataType: 'JSON', //specifies the expected response data type which is used as an argument in the 'success' function
      data: {
        searchFilterArray: searchFilterArray
      },
      success: function(users) {
        updateBooks(users)
      }
    })
    var updateBooks = (users) => {
      this.getOrUpdateBooks(users)
    }
  }
  input(e) {
    messageLocation = null
    if (e.which === 13) {
      if (e.target.id === 'bookSearchBox') {
        this.addBook()
      } else {
        this.filteredSearch()
      }
    }
  }
  clickSearch(e) {
    messageLocation = null
    if (e.target.id === 'bookSearchButton') {
      this.addBook()
    } else {
      this.filteredSearch()
    }
  }
  requestBook(e) {
    var details = e.target.id.split('_')
    var owner = details[1]// = userB.local.username
    var userBIndex = details[2]
    var bookIndex = details[3]
    messageLocation = userBIndex + '_' + bookIndex
    var userB = this.findUser(owner)
    var userBStringifiedOriginal = JSON.stringify(userB)
    var userA = this.findUser(username)
    var userAStringifiedOriginal = JSON.stringify(userA)
    var isbn = userB.local.isbns[bookIndex]
    var requestsToIndex = this.findLocalIndex(owner, userA.local.requestsTo)
    if (requestsToIndex === -1) {
      userA.local.requestsTo.push(this.userObject(owner))
      userA.local.requestsTo[userA.local.requestsTo.length - 1].local.isbns = [isbn]
    } else {
      userA.local.requestsTo[requestsToIndex].local.isbns.push(isbn)
    }
    var userAObject = this.userObject(username)
    userB.local.books[bookIndex].requestsFrom ? userB.local.books[bookIndex].requestsFrom.push(userAObject) : userB.local.books[bookIndex].requestsFrom = [userAObject]
    var userAIndex = this.findUserIndex(username)
    this.updateTwoUsers(userA, userAStringifiedOriginal, userAIndex, userB, userBStringifiedOriginal, userBIndex)
  }
  cancelRequest(e) {
    var details = e.target.id.split('_')
    var owner = details[1]// = userB.local.username
    var userBIndex = details[2]
    var bookIndex = details[3]
    messageLocation = userBIndex + '_' + bookIndex
    var userB = this.findUser(owner)
    var userBStringifiedOriginal = JSON.stringify(userB)
    var isbn = userB.local.isbns[bookIndex]
    var userA = this.findUser(username)
    var userAStringifiedOriginal = JSON.stringify(userA)
    // depopulate requestsTo array
    var requestsToArr = userA.local.requestsTo
    var requestsToIndex = this.findLocalIndex(owner, requestsToArr)
    if (userA.local.requestsTo[requestsToIndex].local.isbns.length > 1) {// state should be modified after updateTwoUsers called
      var isbnIndex = userA.local.requestsTo[requestsToIndex].local.isbns.indexOf(isbn)
      userA.local.requestsTo[requestsToIndex].local.isbns.splice(isbnIndex, 1)
    } else {
      userA.local.requestsTo.splice(requestsToIndex, 1)
    }
    var requestsFromArr = userB.local.books[bookIndex].requestsFrom
    userB.local.books[bookIndex].requestsFrom.splice(this.findLocalIndex(username, requestsFromArr), 1)
    var userAIndex = this.findUserIndex(username)
    this.updateTwoUsers(userA, userAStringifiedOriginal, userAIndex, userB, userBStringifiedOriginal, userBIndex)
  }
  findUserIndex(user_name) {
    var users = this.state.users
    for (let i = 0; i < users.length; i++) {
      if (users[i].local.username === user_name) {
        return i
      }
    }
    return null
  }
  findUser(user_name) {
    var users = JSON.parse(JSON.stringify(this.state.users))
    for (let i = 0; i < users.length; i++) {
      if (users[i].local.username === user_name) {
        return users[i]
      }
    }
    return null
  }
  userObject(user_name) {
    var user = this.findUser(user_name)
    return ({
      local: {
        firstName: user.local.firstName,
        lastName: user.local.lastName,
        username: user.local.username,
        city: user.local.city,
        state: user.local.state,
        country: user.local.country,
        email: user.local.email
      }
    })
  }
  updateTwoUsers(userA, userAStringifiedOriginal, userAIndex, userB, userBStringifiedOriginal, userBIndex) {
    var users = JSON.parse(JSON.stringify(this.state.users))
    $.post('/api/updateTwoUsers', {
      userA: userA,
      userAStringifiedOriginal: userAStringifiedOriginal,
      userB: userB,
      userBStringifiedOriginal: userBStringifiedOriginal
    },
    (data, status) => {
      if (typeof data === 'string') {
        this.displayMessage(data)
      } else {
        var dataA = data[0]
        var dataB = data[1]
        users.splice(userAIndex, 1)
        users.splice(userAIndex, 0, dataA)
        users.splice(userBIndex, 1)
        users.splice(userBIndex, 0, dataB)
        this.getOrUpdateBooks(users)
      }
    })
  }
  findLocalIndex(user_name, localArr) {
    for (let i = 0; i < localArr.length; i++) {
      if (localArr[i].local.username === user_name) {
        return i
      }
    }
    return -1
  }
  acceptRequest(e) {
    var arr = e.target.id.split('_')
    var requester = arr[1]
    var isbn = arr[2]
    var bookIndex = arr[3]
    var userA = this.findUser(username)
    var userAStringifiedOriginal = JSON.stringify(userA)
    var requestsFromArr = userA.local.books[bookIndex].requestsFrom
    var lendingToObject = userA.local.books[bookIndex].requestsFrom.splice(this.findLocalIndex(requester, requestsFromArr), 1)[0]
    userA.local.books[bookIndex].lendingTo = lendingToObject
    var userB = this.findUser(requester)
    var userBStringifiedOriginal = JSON.stringify(userB)
    // populate borrowingFrom array
    var borrowingFromArr = userB.local.borrowingFrom
    var borrowingFromIndex = this.findLocalIndex(username, borrowingFromArr)
    if (borrowingFromIndex === -1) {
      userB.local.borrowingFrom.push(this.userObject(username))
      userB.local.borrowingFrom[borrowingFromArr.length - 1].local.isbns = [isbn]
    } else {
      userB.local.borrowingFrom[borrowingFromIndex].local.isbns.push(isbn)
    }
    // depopulate requestsTo array
    var requestsToArr = userB.local.requestsTo
    var requestsToIndex = this.findLocalIndex(username, requestsToArr)
    if (userB.local.requestsTo[requestsToIndex].local.isbns.length > 1) {
      var isbnIndex = userB.local.requestsTo[requestsToIndex].local.isbns.indexOf(isbn)
      userB.local.requestsTo[requestsToIndex].local.isbns.splice(isbnIndex, 1)
    } else {
      userB.local.requestsTo.splice(requestsToIndex, 1)
    }
    var userAIndex = this.findUserIndex(username)
    var userBIndex = this.findUserIndex(requester)
    messageLocation = userAIndex + '_' + bookIndex
    this.updateTwoUsers(userA, userAStringifiedOriginal, userAIndex, userB, userBStringifiedOriginal, userBIndex)
  }
  rejectRequest(e) {
    var arr = e.target.id.split('_')
    var requester = arr[1]
    var isbn = arr[2]
    var bookIndex = arr[3]
    var userA = this.findUser(username)
    var userAStringifiedOriginal = JSON.stringify(userA)
    var requestsFromArr = userA.local.books[bookIndex].requestsFrom
    userA.local.books[bookIndex].requestsFrom.splice(this.findLocalIndex(requester, requestsFromArr), 1)
    var userB = this.findUser(requester)
    var userBStringifiedOriginal = JSON.stringify(userB)
    // depopulate requestsTo array
    var requestsToArr = userB.local.requestsTo
    var requestsToIndex = this.findLocalIndex(username, requestsToArr)
    if (userB.local.requestsTo[requestsToIndex].local.isbns.length > 1) {
      var isbnIndex = userB.local.requestsTo[requestsToIndex].local.isbns.indexOf(isbn)
      userB.local.requestsTo[requestsToIndex].local.isbns.splice(isbnIndex, 1)
    } else {
      userB.local.requestsTo.splice(requestsToIndex, 1)
    }
    var userAIndex = this.findUserIndex(username)
    var userBIndex = this.findUserIndex(requester)
    messageLocation = userAIndex + '_' + bookIndex
    this.updateTwoUsers(userA, userAStringifiedOriginal, userAIndex, userB, userBStringifiedOriginal, userBIndex)
  }
  cancelLoan(e) {
    var arr = e.target.id.split('_')
    var borrower = arr[1]
    var isbn = arr[2]
    var bookIndex = arr[3]
    var userA = this.findUser(username)
    var userAStringifiedOriginal = JSON.stringify(userA)
    userA.local.books[bookIndex].lendingTo = {}
    var userB = this.findUser(borrower)
    var userBStringifiedOriginal = JSON.stringify(userB)
    // depopulate borrowingFrom array
    var borrowingFromArr = userB.local.borrowingFrom
    var borrowingFromIndex = this.findLocalIndex(username, borrowingFromArr)
    if (userB.local.borrowingFrom[borrowingFromIndex].local.isbns.length > 1) {
      var isbnIndex = userB.local.borrowingFrom[borrowingFromIndex].local.isbns.indexOf(isbn)
      userB.local.borrowingFrom[borrowingFromIndex].local.isbns.splice(isbnIndex, 1)
    } else {
      userB.local.borrowingFrom.splice(borrowingFromIndex, 1)
    }
    var userAIndex = this.findUserIndex(username)
    var userBIndex = this.findUserIndex(borrower)
    messageLocation = userAIndex + '_' + bookIndex
    this.updateTwoUsers(userA, userAStringifiedOriginal, userAIndex, userB, userBStringifiedOriginal, userBIndex)
  }
  deleteBook(e) {
    var arr = e.target.id.split('_')
    var isbn = arr[1]
    var bookIndex = arr[2]
    var user = this.findUser(username)
    var userStringifiedOriginal = JSON.stringify(user)
    user.local.isbns.splice(bookIndex, 1)
    user.local.books.splice(bookIndex, 1)
    this.updateOneUser(user, userStringifiedOriginal)
    var userAIndex = this.findUserIndex(username)
    messageLocation = userAIndex + '_' + bookIndex
  }
  render() {
    var me = this.state.users[this.findUserIndex(username)]
    if (!(pathname === '/myRequestsAndBorrowings' && me && me.local.requestsTo.length === 0 && me.local.borrowingFrom.length === 0)) {
      return (
        <div className='frame' style={{paddingTop: '0px'}}>
          <div className='page'>
            <div className='formBox'>
              <h5 style={myBooksStyle}>Add books I own and want to loan out to my collection:</h5>
              <h5 style={searchBooksStyle}>Search for books in:</h5>
              <input id='bookSearchBox' className='bookSearchInput' type='text' placeholder='Enter book ISBN' style={myBooksStyle} onKeyDown={this.input} />
              <button id='bookSearchButton' style={myBooksStyle} onClick={this.clickSearch}>Add book</button>
              <div style={myBooksStyle}><div id={'message'} style={{visibility: 'hidden'}}>Filler</div></div>
              <input id='city' className='bookSearchInput' type='text' placeholder='Enter city' defaultValue={city} style={searchBooksStyle} onKeyDown={this.input} />
              <input id='state' className='bookSearchInput' type='text' placeholder='Enter state' defaultValue={state} style={searchBooksStyle} onKeyDown={this.input} />
              <input id='country' className='bookSearchInput' type='text' placeholder='Enter country' defaultValue={country} style={searchBooksStyle} onKeyDown={this.input} />
              <button id='filteredSearchButton' style={searchBooksStyle} onClick={this.clickSearch}>Search</button>
              <Users users={this.state.users}  requestBook={this.requestBook} cancelRequest={this.cancelRequest} acceptRequest={this.acceptRequest} rejectRequest={this.rejectRequest} cancelLoan={this.cancelLoan} deleteBook={this.deleteBook} />
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className='frame' style={{paddingTop: '0px'}}>
          <div className='page'>
            <div className='formBox'>
              <div>Nothing to display</div>
            </div>
          </div>
        </div>
      )
    }
  }
}

var Users = function(props) {
  var users = props.users.map(function(user, i) {
    return <BookRows key={i} userIndex={i} user={user} requestBook={props.requestBook} cancelRequest={props.cancelRequest} acceptRequest={props.acceptRequest} rejectRequest={props.rejectRequest} cancelLoan={props.cancelLoan} deleteBook={props.deleteBook} />
  })
  return (
    <table>{users}</table>
  )
}

var BookRows = function(props) {
  var totalUserBooks = props.user.local.books.length
  var books = []
  var bookRow = []
  for (let i = 0; i < totalUserBooks; i++) {
    var book = props.user.local.books[i]
    bookRow.push(book)
    if (bookRow.length === bookTableColumns || i === totalUserBooks - 1) {
      books.push(bookRow)
      bookRow = []
    }
  }
  var bookRows = books.map(function(row, i) {
    return <Books key={props.userIndex + '_' + i} userIndex={props.userIndex} row={row} rowIndex={i} user={props.user} requestBook={props.requestBook} cancelRequest={props.cancelRequest} acceptRequest={props.acceptRequest} rejectRequest={props.rejectRequest} cancelLoan={props.cancelLoan} deleteBook={props.deleteBook} />
  })
  return (
    <tbody>{bookRows}</tbody>
  )
}

var Books = function(props) {
  var books = props.row.map(function(book, i) {
    var isbn = props.user.local.isbns[props.rowIndex * bookTableColumns + i]
    var src
    book.cover ? src = book.cover.medium : src = '/public/images/NoImageAvailable.png'
    var requestsFromUsernameFound = false
    if (book.requestsFrom) {
      for (let i = 0; i < book.requestsFrom.length; i++) {
        if (book.requestsFrom[i].local.username === username) {
          requestsFromUsernameFound = true
          break
        }
      }
    }
    var lendingToUsernameFound
    !book.lendingTo ? lendingToUsernameFound = false : book.lendingTo.local.username === username ? lendingToUsernameFound = true : lendingToUsernameFound = false
    var combinedStyle
    (pathname === '/searchBooks' && props.user.local.username === username) || (pathname === '/myBooks' && props.user.local.username !== username) || (pathname === '/myRequestsAndBorrowings' && !requestsFromUsernameFound && !lendingToUsernameFound) ? combinedStyle = {display: 'none'} : combinedStyle = {display: ''}
    var requestButtonStyle
    props.user.local.username !== username && !requestsFromUsernameFound && !lendingToUsernameFound ? requestButtonStyle = {display: ''} : requestButtonStyle = {display: 'none'}
    var cancelRequestButtonStyle
    requestsFromUsernameFound ? cancelRequestButtonStyle = {display: ''} : cancelRequestButtonStyle = {display: 'none'}
    var onLoanToInfo
    book.lendingTo ? onLoanToInfo = book.lendingTo.local.username + ' from ' + book.lendingTo.local.city + ', ' + book.lendingTo.local.state + ', ' + book.lendingTo.local.country + '.' : onLoanToInfo = 'No one'
    var displayedEmail
    book.lendingTo ? displayedEmail = book.lendingTo.local.email : ''
    var onLoanToEmailDisplayStyle
    pathname === '/myBooks' && onLoanToInfo !== 'No one' ? onLoanToEmailDisplayStyle = {display: ''} : onLoanToEmailDisplayStyle = {display: 'none'}
    var onLoanInfo
    book.lendingTo ? onLoanInfo = 'Yes' : onLoanInfo = 'No'
    var ownerDetailsDisplayStyle
    pathname === '/myRequestsAndBorrowings' && book.lendingTo ? ownerDetailsDisplayStyle = {display: ''} : ownerDetailsDisplayStyle = {display: 'none'}
    var requestsFromCount
    book.requestsFrom ? requestsFromCount = book.requestsFrom.length : requestsFromCount = '0'
    var cancelLoanButtonStyle
    book.lendingTo && props.user.local.username === username ? cancelLoanButtonStyle = {display: ''} : cancelLoanButtonStyle = {display: 'none'}
    var cancelLoanButtonId
    book.lendingTo ? cancelLoanButtonId = 'cancelLoan_' + book.lendingTo.local.username + '_' + isbn + '_' + (props.rowIndex * bookTableColumns + i) : cancelLoanButtonId = ''
    var deleteBookButtonStyle
    props.user.local.username === username && !book.lendingTo && !book.requestsFrom ? deleteBookButtonStyle = {display: ''} : deleteBookButtonStyle = {display: 'none'}
    return (
      <td key={props.userIndex + '_' + props.rowIndex + '_' + i} style={combinedStyle}>
        <img src={src} />
        <div>Title: <a href={book.url} target='_blank'><span>{book.title}</span></a></div>
        <div>Author: <a href={book.authors[0].url} target='_blank'><span>{book.authors[0].name}</span></a></div>
        <div>Location: {props.user.local.city}, {props.user.local.state}, {props.user.local.country}</div>
        <div style={ownerDetailsDisplayStyle}>Owner: {props.user.local.username}</div>
        <div style={ownerDetailsDisplayStyle}>Email: {props.user.local.email}</div>
        <div id={'message_' + props.userIndex + '_' + (props.rowIndex * bookTableColumns + i)} className='bookMessage' style={{visibility: 'hidden'}}>Filler</div>
        <div>Requesters:</div>
        <div style={myBooksStyle}><RequestsFrom book={book} isbn={isbn} bookIndex={props.rowIndex * bookTableColumns + i} acceptRequest={props.acceptRequest} rejectRequest={props.rejectRequest} /></div>
        <div style={notMyBooksStyle}>({requestsFromCount})</div>
        <button id={'requestBook_' + props.user.local.username + '_' + props.userIndex + '_' + (props.rowIndex * bookTableColumns + i)} style={requestButtonStyle} onClick={props.requestBook}>Request this book</button>
        <button id={'cancelRequest_' + props.user.local.username + '_' + props.userIndex + '_' + (props.rowIndex * bookTableColumns + i)} style={cancelRequestButtonStyle} onClick={props.cancelRequest}>Cancel request</button>
        <div style={myBooksStyle}>On loan to:<div>{onLoanToInfo}<div style={onLoanToEmailDisplayStyle}> Email: {displayedEmail}.</div></div></div>
        <div style={notMyBooksStyle}>On loan:<div>{onLoanInfo}</div></div>
        <button id={cancelLoanButtonId} style={cancelLoanButtonStyle} onClick={props.cancelLoan}>Cancel loan</button>
        <button id={'deleteBook_' + isbn + '_' + (props.rowIndex * bookTableColumns + i)} style={deleteBookButtonStyle} onClick={props.deleteBook}>Delete book</button>
      </td>
    )
  })
  return (
    <tr>{books}</tr>
  )
}

var RequestsFrom = function(props) {
  if (props.book.requestsFrom) {
    var requestsFrom = props.book.requestsFrom.map(function(requester, i) {
      var acceptRequestIconStyle
      props.book.lendingTo ? acceptRequestIconStyle = {display: 'none'} : acceptRequestIconStyle = {display: ''}
      return <div key={'requestsFrom' + '_' + props.userIndex + '_' + props.bookIndex + '_' + i}>{requester.local.username} from {requester.local.city}, {requester.local.state}, {requester.local.country}.<div style={myBooksStyle}> Email: {requester.local.email}.</div> <i id={'accept_' + requester.local.username + '_' + props.isbn + '_' + props.bookIndex} className='fa fa-check' style={acceptRequestIconStyle} onClick={props.acceptRequest}></i><i id={'reject_' + requester.local.username + '_' + props.isbn + '_' + props.bookIndex} className='fa fa-remove' onClick={props.rejectRequest}></i></div>
    })
    return (
      <div>
        {requestsFrom}
      </div>
    )
  } else {
    return <div>No one</div>
  }
}

ReactDOM.render(<DisplayBooks />, document.getElementById('target'))
