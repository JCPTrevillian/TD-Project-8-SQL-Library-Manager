var express = require('express');
var router = express.Router();
const Book = require('../models').Book; 
const { Op } = require('sequelize');


function asyncHandler(callback){
  return async(req, res, next) => {
    try {
      await callback(req, res, next)
    } catch(error){
      next(error);
    }
  }
}
 
router.get('/', asyncHandler( async (req, res) => {
  
  const limit = 5;
  const page = req.query.page || 1; 

  const { count, rows:books } = await Book.findAndCountAll({
    order: [['title', 'ASC']],
    limit,
    offset: (page - 1) * limit
  });
  const numOfPages = Math.ceil(count / 5); 

    res.render("index", { books, title: 'Library', numOfPages });
 
}));


router.get('/new', asyncHandler( async (req, res) => {
  res.render('books/new-book', { book: {}, title: 'New Book' });
}));

//new book 
router.post('/new', asyncHandler( async (req, res) => {
  let book;
  try {
    book = await Book.create(req.body) 
    res.redirect('/books');

  } catch (error){
    if (error.name === "SequelizeValidationError") { 
      book = await Book.build(req.body);
      res.render("books/new-book", { book, errors: error.errors, title: "New Book" });
    } else {
        throw error;
      }
 
  }
}));

const getBooks = async(searchValue, page, limit) => {

  const {count, rows: books} = await Book.findAndCountAll({
    where: {
     [Op.or]: {
       title: {
         [Op.like]: `%${searchValue}%`
       },
       author: {
        [Op.like]: `%${searchValue}%`
      },
      genre: {
        [Op.like]: `%${searchValue}%`
      },
      year: {
        [Op.like]: `%${searchValue}%`
      }
     }
    },
    order: [["title", "ASC"]], 
    limit,
    offset: (page - 1) * limit
  });
  return {count, books}

}

router.get('/search', asyncHandler( async (req, res) => {

  const { searchValue } = req.query; 


  if (!searchValue){
    res.redirect('/books');
  }
  
  const page = req.query.page || 1; 

  const limit = 5; 
  const {count , books} = await getBooks(searchValue, page, limit);

  if (count > 0){
    console.log(count, books)
    const numOfPages = Math.ceil(count / limit); 
    res.render('index', { books, title: "Search",numOfPages, searchValue})
  }
  else {
    res.render("books/books-not-found", {title: "Search"})
  }

}));

// book detail
router.get('/:id', asyncHandler( async (req, res, next) => {
  const book = await Book.findByPk(req.params.id)
  if (book) {
    res.render("books/update-book", { book, errors: false, title: "Update Book" });
  } else {
    throw new Error();
  }
}));

// updates book info 
router.post('/:id', asyncHandler( async (req, res,next) => {
  let book;
  try {
      book = await Book.findByPk(req.params.id)
      if (book) {
          await book.update(req.body)
          res.redirect('/books')
      } else {
        throw new Error();
      }
  } catch (error) {
      if (error.name === 'SequelizeValidationError') {
          book = await Book.build(req.body)
          book.id = req.params.id; 
          res.render('books/update-book', { book, errors: error.errors, title : "Update Book" })
      } else {
        throw error;
      }
  }
}));

//delete book 
router.get("/:id/delete", asyncHandler(async (req, res, next) => {
  const book = await Book.findByPk(req.params.id);
  if (book) {
    res.render("books/delete", { book, title: "Delete Book" });
  } else {
    next();
  }
 
}));
//  permanently delete book - can't undo 
router.post('/:id/delete', asyncHandler( async (req, res, next) => {
  
  const book = await Book.findByPk(req.params.id)
  if (book) {
    await book.destroy(req.body);
    res.redirect('/books')
    } 
  else {
    next();
  }
}));

module.exports = router;





