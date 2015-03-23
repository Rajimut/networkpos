var express     = require('express.io');
var router      = express();
var passport    = require('passport');
var _           = require('underscore');
var crypto      = require('crypto');
var MongoWatch  = require('mongo-watch');

//Define Models for each Schema created
var InvoiceDetail = require('../models/invoice-detail');
var SellerDB        = require('../models/seller-details');
var buyerDB         = require('../models/buyer-details');
var User            = require('../models/user');
var fs = require('fs');
module.exports = function (router, passport) {

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Welcome' });
});

/* POST customer is a Buyer */
router.post('/buyer', function(req, res) {
    res.location("buyer-login");
    res.redirect("buyer-login");
});

/* POST customer is a Seller */
router.post('/seller', function(req, res) {
    res.location("seller-login");
    res.redirect("seller-login");
});

/* POST to Buyer login form */
router.get('/buyer-login', function(req, res) {
    // render the page and pass in any flash data if it exists
    if (req.isAuthenticated()) {
        req.login = "Buyer-Loggedin";
        res.location("myreceipts");
        res.redirect("myreceipts");
    } else {
        res.render('buyer-login', { message: req.flash('loginMessage') });
    }
});

// Process the login form
router.post('/buyer-login', passport.authenticate('local-login', {
        successRedirect : '/myreceipts', // redirect to the secure profile section
        failureRedirect : '/buyer-login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
}));

/* POST to Seller login form */
router.get('/seller-login', function(req, res) {
    // render the page and pass in any flash data if it exists
    if (req.isAuthenticated()) {
        req.login = "Seller-Loggedin";
        res.location("POSterminal");
        res.redirect("POSterminal");
    } else {
        res.render('seller-login', { message: req.flash('loginMessage') });
    }
});

// Process the login form
router.post('/seller-login', passport.authenticate('local-login', {
        successRedirect : '/POSterminal', // redirect to the secure profile section
        failureRedirect : '/seller-login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
}));

// =====================================
// SIGNUP ==============================
// =====================================
// show the signup form
router.get('/seller-signup', function(req, res) {
    if (req.isAuthenticated()) {
        req.login = "Seller-Loggedin";
        res.location("POSterminal");
        res.redirect("POSterminal");
    } else {
        req.login = "Seller-Signup";
        res.render('seller-signup.jade');
    }

    // render the page and pass in any flash data if it exists
    //res.render('signup', { message: req.flash('signupMessage') });
});

router.get('/buyer-signup', function(req, res) {
    if (req.isAuthenticated()) {
        req.login = "Buyer-Loggedin";
        res.location("myreceipts");
        res.redirect("myreceipts");
    } else {
        req.login = "Buyer-Signup";
        res.render('buyer-signup.jade');
    }
    // render the page and pass in any flash data if it exists
    //res.render('signup', { message: req.flash('signupMessage') });
});

router.post('/seller-signup',
    passport.authenticate('local-signup', { failureRedirect: '/seller-signup', failureFlash: false }),
            function(req, res) {

                var temp_seller_details = new SellerDB();

                temp_seller_details.seller_name         =   req.body.companyname;
                temp_seller_details.seller_email        =   req.body.email;

                console.log("Upload file : " + req.body.companylogo + "  " + req.body.path);
                console.log(req.files);

                fs.readFile(req.files.img_companylogo.path, function (err, data) {
                    var newPath = '/var/mushroomDB/seller/images/' + req.files.img_companylogo.name;
                    fs.writeFile(newPath, data, function (err) {
                    if (err) throw err; // DELETE USER

                      temp_seller_details.seller_logo         =   "/var/mushroomDB/seller/images/" + req.files.img_companylogo.name;
                      temp_seller_details.seller_st_addr      =   req.body.streetAddress;
                      temp_seller_details.seller_city         =   req.body.city;
                      temp_seller_details.seller_state        =   req.body.state;
                      temp_seller_details.seller_zipcode      =   req.body.zip;
                      //temp_seller_details.seller_categories =   req.body.  //Future item
                      temp_seller_details.customer_flag       =   req.body.customertype;
                        
                    User.update({'local.email':req.body.email}, {$set:{'local.customer_flag':req.body.customertype}},function(err){console.log('error : ' + err);});



                      temp_seller_details.save(function(error, data){
                        if (error){
                            console.log("error case" + error);
                            // DELETE USER
                            res.send("There was a problem adding the information to the seller database." + error);
                        } else {
                            // And forward to success page
                            console.log("Seller added to DB");
                            // Change login from Seller-Signup to Seller-Loggedin
                            req.login = "Seller-Loggedin";
                        }
                        });
                    });
                });
                res.redirect('/POSterminal');
            });

router.post('/buyer-signup',
    passport.authenticate('local-signup', { customerflag:'buyer', failureRedirect: '/buyer-signup', failureFlash: false }),
            function(req, res) {

                var temp_buyer_details = new SellerDB();


                temp_buyer_details.buyer_name       =   req.body.buyername;
                temp_buyer_details.buyer_email      =   req.body.email;
                // temp_buyer_details.buyer_pic        =   "/var/mushroomDB/buyer/images/" + req.files.img_companylogo.name;
                temp_buyer_details.buyer_sex        =   req.body.buyersex;
                temp_buyer_details.buyer_dob        =   req.body.buyerdob;
                temp_buyer_details.buyer_st_addr    =   req.body.streetAddress;
                temp_buyer_details.buyer_city       =   req.body.city;
                temp_buyer_details.buyer_state      =   req.body.state;
                temp_buyer_details.buyer_zipcode    =   req.body.zip;
                temp_buyer_details.buyer_sharedata  =   req.body.sharedata;
                temp_buyer_details.customer_flag    =   req.body.customertype;


                User.update({'local.email':req.body.email}, {$set:{'local.customer_flag':req.body.customertype}},function(err){console.log('error : ' + err);});

                // NEED TO ADD LOGIC FOR BUYER PROFILE PIC
                // PHOTO UPLOAD ON DIRECTORY AVAILABILITY
                // ERROR CHECKING ON IMAGES
                // FLOW TO BE DEFINED

                // fs.readFile(req.files.img_companylogo.path, function (err, data) {
                //     var newPath = '/var/mushroomDB/seller/images/' + req.files.img_companylogo.name;
                //     fs.writeFile(newPath, data, function (err) {
                //     if (err) throw err; // DELETE USER

                      temp_buyer_details.save(function(error, data){
                        if (error){
                            console.log("error case" + error);
                            // DELETE USER
                            res.send("There was a problem adding the information to the seller database." + error);
                        } else {
                            // And forward to success page
                            console.log("Seller added to DB");
                            // Change login from Seller-Signup to Seller-Loggedin
                            req.login = "Seller-Loggedin";
                        }
                        });
                //     });
                // });
                res.redirect('/myreceipts');
            });



// =====================================
// PROFILE SECTION =====================
// =====================================
// we will want this protected so you have to be logged in to visit
// we will use route middleware to verify this (the isLoggedIn function)

router.get('/buyer-profile', isLoggedIn, function(req, res) {
    res.render('buyer-profile.jade', {
        user : req.user // get the user out of session and pass to template
    });
});

router.get('/seller-profile', isLoggedIn, function(req, res) {
    res.render('seller-profile.jade', {
        user : req.user // get the user out of session and pass to template
    });
});

router.get('/graphicalview', isLoggedIn, function(req, res) {
    res.render('graphicalview.jade', {
        user : req.user // get the user out of session and pass to template
    });
});

// var config = require( __dirname + '/receipt.json');
// var file = __dirname + '/receipt.json';
// var fs = require("fs");
// var data = JSON.parse(fs.readFileSync(file, "utf8"));
// console.dir(data);
// data = JSON.stringify(data);

// Method to pull receipts for a certain buyer
router.get('/myreceipts', isLoggedIn, function(req, res) {

    //Start listening port to receive notifications
    watcher = new MongoWatch({format: 'pretty'});
 
    console.log("Setting up watcher to watch over for events");
    watcher.watch('invoicedetail.invoicedetails', function(event) {
        console.log('something changed:', event);
    });

    console.log("Buyer : " + req.user.local.email);

    //Look up the invoice database using the buyer's username
    InvoiceDetail.find({ 'buyer_name' : req.user.local.email}, function(err,invoice) {
        if (err) {
            res.send("There was an error looking up records for buyer " + req.user.local.email + ":" + err);
        } else {
            res.render('myreceipts', {myreceipt_: invoice});
        }
    });
});

router.get('/singlereceipt/:transaction_id', isLoggedIn, function(req, res) {
    var receipt_id = req.params.transaction_id;
    console.log('incoming id ' + req.params.transaction_id);
//  finding by string not working from Browser. Using _id need to find a better approach. Uma
    //Look up the invoice database using the buyer's username
    InvoiceDetail.find({'transaction_id' :receipt_id}, function(err,invoice) {
        // console.log('id is '+ invoice + ' kk ' + req.params._id);
        if (err) {
            return res.send("There was an error looking up records for buyer " + req.user.local.email + ":" + err);
        } else {
            
            res.render('mixins/mixin-receipt.jade', {receipt: invoice[0]});
        }
    });
    
   
});

router.get('/buyer-transactions', isLoggedIn, function(req, res) {
    //res.render('buyer-transactions', {json_data: data});
    InvoiceDetail.find({ 'buyer_name' : req.user.local.email}, function(err,invoice) {
        if (err) {
            res.send("There was an error looking up records for buyer " + req.user.local.email + ":" + err);
        } else {
            res.render('buyer-transactions', {buyertransactions_: invoice});
        }
    });
});

router.get('/buyer-apps', isLoggedIn, function(req, res) {
    //res.render('buyer-transactions', {json_data: data});
    InvoiceDetail.find({ 'buyer_name' : req.user.local.email}, function(err,invoice) {
        if (err) {
            res.send("There was an error looking up records for buyer " + req.user.local.email + ":" + err);
        } else {
            res.render('buyer-apps.jade');
        }
    });
});
router.get('/buyer-app-store', isLoggedIn, function(req, res) {
    //res.render('buyer-transactions', {json_data: data});
        res.location("buyer-app-store");
        //res.redirect("buyer-app-store");
        res.render('buyer-app-store.jade');
});

// =====================================
// LOGOUT ==============================
// =====================================
router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

/* GET Hello World page. */
router.get('/helloworld', isLoggedIn, function(req, res)  {
        InvoiceDetail.find({ 'buyer_name' : req.user.local.email}, function(err,invoice) {
        if (err) {
            res.send("There was an error looking up records for buyer " + req.user.local.email + ":" + err);
        } else {
            res.render('helloworld', {buyertransactions_: invoice});
        }
    });
});

router.get('/POSterminal', isLoggedIn, function(req, res) { //ACCESSED DURING FIRST REQUEST
    req.session.current_receipt_no = crypto.randomBytes(3).toString('hex'); //Date.now();  //uniquely generate transaction id - time based
    req.session.save(); // ADDED TO RETAIN SESSSION
    console.log("req.session.current_receipt_no" + req.session.current_receipt_no);
    res.render('POSterminal', { "receipt_no" : req.session.current_receipt_no, title: 'POSterminal' });
});


router.post('/new-billing', isLoggedIn, function(req, res) { // NEEDED FOR NEW BILLING IN AJAX
    req.session.current_receipt_no = crypto.randomBytes(3).toString('hex'); //Date.now();  //uniquely generate transaction id - time based
    req.session.save(); // ADDED TO RETAIN SESSSION
    res.setHeader("Content-Type", "text/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.end('{"success" : "Updated Successfully","receipt_no" : "' + req.session.current_receipt_no +  '", "status" : 200}');

});

//Notification that billing has stopped - insert json into db
router.post('/post-billing', isLoggedIn, function(req, res) { //RENAMED FOR CONSISTENCY

    // Create an instance of the Invoice Details Schema
    var temp_invoice_details = new InvoiceDetail();

    temp_invoice_details.transaction_id     = req.session.current_receipt_no;  //uniquely generate transaction id - time based

    // Set current_receipt_no in session variable to null since we store in the DB which is persistent.
    req.session.current_receipt_no = null;

    //extract information from form
    temp_invoice_details.transaction_date   = new Date();               //Get current date for date for transaction
    temp_invoice_details.seller_name        = req.user.local.email;             //extract currently logged in seller
    temp_invoice_details.buyer_name         = req.body.buyer_name;  //EMAIL AddressFor future updates. Needs flash login of Buyer.
    temp_invoice_details.paymenttype        = req.body.paymenttype;
    temp_invoice_details.tax                = req.body.tax;
    temp_invoice_details.beforetax          = req.body.beforetax;
    temp_invoice_details.aftertax           = req.body.aftertax;
    temp_invoice_details.item_details       = req.body.item_details;

    console.log("temp_invoice_details : " + temp_invoice_details);
    
    temp_invoice_details.save(function(error, data){
         if(error){
             console.log("error case" + error);
             res.end('{"fail" : "Failed with error : ' + error + ', "status" : 200}');
             //res.send("There was a problem adding the information to the database." + error);
         }
         else{
             //res.location("POSterminal");
             // And forward to success page
            console.log("Transaction Completed");
            res.end('{"success" : "Updated Successfully", "status" : 200}');
         }
    });
});


/* POST to Add User Service */

};