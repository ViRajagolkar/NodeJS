// load the required packages
var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var jwt = require("jsonwebtoken");
mongoose.Promise = global.Promise;
var cors = require("cors");
var instance = express();
var router = express.Router();
instance.use(router);
instance.use(bodyParser.urlencoded({ extended: false }));
instance.use(bodyParser.json());
instance.use(cors());

//Configure to connect to mongodb using mongoose
mongoose.connect(
  "mongodb://localhost/ProductsAppDb",
  { useNewUrlParser: true }
);

var dbConnect = mongoose.connection;
if (!dbConnect) {
  console.log("Sorry Connection is not established");
  return;
}

//Creating userSchema and mapping to userModel
var userSchema = mongoose.Schema({
  UserName: String,
  Password: String
});

var userModel = mongoose.model("User", userSchema, "User");

//Creating productSchema and mapping to productModel
var productsSchema = mongoose.Schema({
  ProductId: Number,
  ProductName: String,
  CategoryName: String,
  Manufacturer: String,
  Price: Number
});

var productModel = mongoose.model("Products", productsSchema, "Products");

//To create new user using post method
instance.post("/api/users/create", function(request, response) {
  var user = {
    UserName: request.body.UserName,
    Password: request.body.Password
  };

  userModel.create(user, function(err, res) {
    if (err) {
      response.statusCode = 500;
      response.send(err);
    }
    response.send({ status: 200, data: res });
  });
});

//Generate the secrete key for jwtSecret
var jwtSettings = {
  jwtSecret: "vitthalrajagolkar@harbingergroup.com"
};

//Set the secrete key with express
instance.set("jwtSecret", jwtSettings.jwtSecret);
var tokenStore;

// Authenticate user for post operation
instance.post("/api/users/auth", function(request, response) {
  var user = {
    UserName: request.body.UserName,
    Password: request.body.Password
  };

  //console.log("In Auth User " + JSON.stringify(user));

  userModel.findOne({ UserName: request.body.UserName }, function(err, usr) {
    if (err) {
      response.send({ status: 500, error: err });
    }
    if (!usr) {
      //console.log("User condt"+ JSON.stringify(usr));
      response.send({
        status: 400,
        message: "User not found...!"
      });
    } else if (usr) {
     // console.log("In else If" + JSON.stringify(usr));
      if (usr.Password != user.Password) {
        console.log("In false condt");
        response.send({status: 404, message: "Sorry, UserName and Password does not match..!"
        });
      } else {
        //console.log("In success condt");
        var token = jwt.sign({ usr }, instance.get("jwtSecret"), { expiresIn: 3600 });
        //save token globally
        tokenStore = token;
        response.send({
          authenticated: true,
          message: "Login Success",
          token: token
        });
      }
    }
  });
});

instance.get("/api/products", function(request, response) {
  var tokenReceived = request.headers.authorization.split(" ")[1];
  jwt.verify(tokenReceived, instance.get("jwtSecret"), function(err, decoded) {
    //console.log("In verify");
    if (err) {
      //console.log("In auth error");
      response.send({ success: false, message: "Token verification failed" });
    } else {
      //console.log("In auth success");
      request.decoded = decoded;
      productModel.find().exec(function(err, res) {
        if (err) {
          response.statusCode = 500;
          response.send({ status: response.statusCode, error: err });
        }
        response.send({ status: 200, data: res });
      });
    }
  });
});

instance.post("/api/products", function(request, response) {
  //console.log("In Post...");
  var prd = {
    ProductId: request.body.ProductId,
    ProductName: request.body.ProductName,
    CategoryName: request.body.CategoryName,
    Manufacturer: request.body.Manufacturer,
    Price: request.body.Price
  };

  var tokenReceived = request.headers.authorization.split(" ")[1];
  jwt.verify(tokenReceived, instance.get("jwtSecret"), function(err, decoded) {
    console.log("In verify");
    if (err) {
      console.log("In auth error");
      response.send({ success: false, message: "Token verification failed" });
    } else {
      console.log("In auth success");
      request.decoded = decoded;
      productModel.create(prd, function(err, res) {
        if (err) {
          response.statusCode = 500;
          response.send(err);
        }
        response.send({ status: 200, data: res });
      });
    }
  });
});

// instance.get("/api/products/:id", function(request, response) {
//   var tokenReceived = request.headers.authorization.split(" ")[1];
//   jwt.verify(tokenReceived, instance.get("jwtSecret"), function(err, decoded) {
//     console.log("In verify");
//     if (err) {
//       console.log("In auth error");
//       response.send({ success: false, message: "Token verification failed" });
//     } else {
//       console.log("In auth success");
//       request.decoded = decoded;

//       var id = request.params.id;
//       console.log("Received id =" + id);

//       productModel.findById({ ProductId: id }, function(err, res) {
//         if (err) {
//           response.statusCode = 500;
//           response.send(err);
//         }
//         response.send({ status: 200, data: res });
//       });
//     }
//   });
// });

instance.put("/api/products/:id", function(request, response) {
  var tokenReceived = request.headers.authorization.split(" ")[1];
  jwt.verify(tokenReceived, instance.get("jwtSecret"), function(err, decoded) {
    console.log("In verify");
    if (err) {
      console.log("In auth error");
      response.send({ success: false, message: "Token verification failed" });
    } else {
      console.log("In auth success");
      request.decoded = decoded;

      var prod = {
        ProductId: request.body.ProductId,
        ProductName: request.body.ProductName,
        CategoryName: request.body.CategoryName,
        Manufacturer: request.body.Manufacturer,
        Price: request.body.Price
      };
      console.log(JSON.stringify(prod));
      var cond = {
        ProductId: request.params.id
      };
      console.log(JSON.stringify(cond));

      var id = request.params.id;
      console.log("Received id =" + id);
      productModel.updateOne(cond, prod, function(err, res) {
        if (err) {
          respose.status = 500;
          response.send({ status: respose.status, error: err });
        }
        response.send({
          status: 200,
          data: "Product record successfully updated..!"
        });
      });
    }
  });
});

instance.delete("/api/products/:id", function(request, response) {
  var tokenReceived = request.headers.authorization.split(" ")[1];
  jwt.verify(tokenReceived, instance.get("jwtSecret"), function(err, decoded) {
   // console.log("In verify");
    if (err) {
     // console.log("In auth error");
      response.send({ success: false, message: "Token verification failed" });
    } else {
      //console.log("In auth success");
      request.decoded = decoded;

      var id = request.params.id;
      //console.log("Received id =" + id);
      productModel.deleteOne({ ProductId: id }, function(err, res) {
        if (err) {
          response.send({ status: 500, error: err });
        }
        response.send({ status: 200, data: "Product has been Deleted..!" });
      });
    }
  });
});

instance.listen(4040, function() {
  console.log("Started listening on port 4040");
});
