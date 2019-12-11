'use strict';
var http = require('http');
var fs = require('fs');
var url = require('url');
var Web3jService = require('./nodejs-sdk/packages/api/web3j').Web3jService;
var crud = require('./nodejs-sdk/packages/cli/interfaces/crud').interfaces;
const utils = require('./nodejs-sdk/packages/api/common/utils');
//const SupplyChainAddr = "0x861b700f6a86baa8d31d61518149add8e62d770a";
const SupplyChainAddr = "0xe4a741c3b8209e5e2fc443ace071fd950f875128";
//const SupplyChainAddr = "0x62195d0f77f66c445c4878b845f55d266875705d";

const BaseTime = "1970-01-01"
var api = new Web3jService();
var express = require('express');
var app = express();
app.use(express.static('public'));
//app.use('/public', express.static('public'));

var abi = [{"constant":false,"inputs":[{"name":"comname_from","type":"string"},{"name":"comname_to","type":"string"},{"name":"amount","type":"int256"},{"name":"start_date","type":"int256"},{"name":"end_date","type":"int256"},{"name":"status","type":"string"}],"name":"transferReceipt","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"new_days","type":"int256"}],"name":"addDay","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"comname","type":"string"}],"name":"queryReceipt","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"comname","type":"string"},{"name":"comaddress","type":"string"},{"name":"comkind","type":"string"}],"name":"registerCompany","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ret","type":"int256"},{"indexed":false,"name":"comname","type":"string"},{"indexed":false,"name":"comaddress","type":"string"},{"indexed":false,"name":"comkind","type":"string"}],"name":"RegisterEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"ret","type":"int256"},{"indexed":false,"name":"comname_from","type":"string"},{"indexed":false,"name":"comname_to","type":"string"},{"indexed":false,"name":"amount","type":"int256"},{"indexed":false,"name":"start_date","type":"int256"},{"indexed":false,"name":"end_date","type":"int256"},{"indexed":false,"name":"status","type":"string"}],"name":"TransferEvent","type":"event"}];
const { CRUDService, Table, Condition, Entry } = require('./nodejs-sdk/packages/api');
let crudService = new CRUDService();




function parseCondition(condition) {
    let ops = ['!=', '>=', '<=', '>', '<', '='];

    for (let op of ops) {
        let pos = condition.indexOf(op);
        if (pos >= 0) {
            let key = condition.substring(0, pos);
            let value = condition.substring(pos + 1);
            let ret = new Condition();

            switch (op) {
                case '!=':
                    ret.ne(key, value);
                    return ret;
                case '>=':
                    ret.ge(key, value);
                    return ret;
                case '<=':
                    ret.le(key, value);
                    return ret;
                case '>':
                    ret.gt(key, value);
                    return ret;
                case '<':
                    ret.lt(key, value);
                    return ret;
                case '=':
                    ret.eq(key, value);
                    return ret;
                default:
                    throw new Error('impossible to here');
            }
        }
    }

    throw new Error('illegal condition expression');
}


function select(argv) {
  let tableName = argv.tableName;
  let key = argv.key;
  let condition = parseCondition(argv.condition);
  return crudService.desc(tableName).then(tableInfo => {
      let table = new Table(tableInfo.tableName, key, tableInfo.valueFields, tableInfo.optional);
      return crudService.select(table, condition);
  });
}


function test() {
  var temp_args={
    'tableName':'receiptfrom',
    'key':'test1',
    'condition':'mark=1'      
  };

  var temp = select(temp_args);
  temp.then(function(value) {
    console.log(value);
  })


  var params = ["test1"];
  var functions = abi.filter(value => value.type === 'function').map(value => value.name);
  var functionName = utils.spliceFunctionSignature(abi[2]);

  api.call(SupplyChainAddr, functionName, params).then(result => {
      let status = result.result.status;
      let ret = {
          status: status
      };
      let output = result.result.output;
      if (output !== '0x') {
          ret.output = utils.decodeMethod(abi[2], output);
      }
      console.log(ret);
  });

}

// test();

function DateDiff(sDate1, sDate2) { //sDate1和sDate2是2017-9-25格式 
    var aDate, oDate1, oDate2, iDays
    aDate = sDate1.split("-")
    oDate1 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0]) //转换为9-25-2017格式 
    aDate = sDate2.split("-")
    oDate2 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0])
    iDays = parseInt((oDate2 - oDate1) / 1000 / 60 / 60 / 24) //把相差的毫秒数转换为天数 
    return iDays;
}

// get date by date + offset
function getDate(date1, dateoff) {
  var aDate = date1.split("-")
  var oDate1 = new Date(aDate[1] + '-' + aDate[2] + '-' + aDate[0]) //转换为9-25-2017格式
  var offset = dateoff*1000*60*60*24;
  var curDay = new Date();
  curDay.setTime(oDate1.getTime()+offset);
  return curDay.getFullYear()+"-"+(parseInt(curDay.getMonth())+1)+"-"+curDay.getDate();
}


app.get('/query_process',function(req, res) {
  var part1 = "<!doctype html><html lang=\"en\"><head>  <meta charset=\"utf-8\" />  <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge,chrome=1\" />  <link rel=\"apple-touch-icon\" sizes=\"76x76\" href=\"assets/img/apple-icon.png\" />  <link rel=\"icon\" type=\"image/png\" href=\"assets/img/favicon.png\" />  <title>Financial Chain Supply</title> <meta content=\'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0\' name=\'viewport\' />    <meta name=\"viewport\" content=\"width=device-width\" /> <!-- CSS Files -->    <link href=\"assets/css/bootstrap.min.css\" rel=\"stylesheet\" /> <link href=\"assets/css/paper-bootstrap-wizard.css\" rel=\"stylesheet\" />  <!-- CSS Just for demo purpose, don\'t include it in your project --> <link href=\"assets/css/demo.css\" rel=\"stylesheet\" />  <!-- Fonts and Icons -->    <link href=\"http://netdna.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.css\" rel=\"stylesheet\"> <link href=\'https://fonts.googleapis.com/css?family=Muli:400,300\' rel=\'stylesheet\' type=\'text/css\'> <link href=\"assets/css/themify-icons.css\" rel=\"stylesheet\"></head><body>  <div class=\"image-container set-full-height\" style=\"background-image: url(\'assets/img/paper-2.jpeg\')\">      <!--   Big container   -->      <div class=\"container\">         <div class=\"row\">           <div class=\"col-sm-12 \">                <!--      Wizard container        -->               <div class=\"wizard-container\">                  <div>                             <input type=\'button\' class=\'btn btn-next btn-fill btn-primary\'  name=\'next\' value=\'Back to Index\' onclick=\"location=\'/index.html\'\"/>                      </div>                      <div class=\"card wizard-card\" data-color=\"green\" id=\"wizard\">                   <!--        You can switch \" data-color=\"green\" \"  with one of the next bright colors: \"blue\", \"azure\", \"orange\", \"red\"       -->                         <div class=\"wizard-header\">                             <h3 class=\"wizard-title\">Query Receipt</h3>                         </div>                <div class=\"wizard-navigation\">                 <div class=\"progress-with-circle\">                      <div class=\"progress-bar\" role=\"progressbar\" aria-valuenow=\"1\" aria-valuemin=\"1\" aria-valuemax=\"4\" style=\"width: 50%;\"></div>                 </div>                  <ul>                                  <li>                      <a href=\"#location\" data-toggle=\"tab\">                        <div class=\"icon-circle\">                         <i class=\"ti-map\"></i>                        </div>                        Receipt Query                     </a>                    </li>                             </ul>               </div>                            <div class=\"tab-content\">                               <div class=\"tab-pane\" id=\"location\">                                  <div class=\"row\">                                     <div class=\"col-sm-5\">                                          <h5 class=\"info-text\"></h5>                                   </div>                                      <div class=\"col-sm-12 col-sm-offset-1\">                                         <div class=\"form-group\">                                              <label class=\"col-sm-2\"><p>Name of Borrowing Company</p></label>                                              <label class=\"col-sm-2\"><p>Name of Loan Company</p></label>                                             <label class=\"col-sm-2\"><p>Start Date</p></label>                                             <label class=\"col-sm-2\"><p>End Date</p></label>                                             <label class=\"col-sm-2\"><p>Amount</p></label>                                         </div>                                                  </div>";
  var part2 = "</div>                               </div>                            </div>                                                          </div>                </div> <!-- wizard container -->            </div>          </div> <!-- row -->     </div> <!--  big container -->      <div class=\"footer\">          <div class=\"container text-center\">             by Jenny          </div>      </div>  </div></body> <!--   Core JS Files   -->  <script src=\"assets/js/jquery-2.2.4.min.js\" type=\"text/javascript\"></script>  <script src=\"assets/js/bootstrap.min.js\" type=\"text/javascript\"></script> <script src=\"assets/js/jquery.bootstrap.wizard.js\" type=\"text/javascript\"></script> <!--  Plugin for the Wizard --> <script src=\"assets/js/paper-bootstrap-wizard.js\" type=\"text/javascript\"></script>  <!--  More information about jquery.validate here: http://jqueryvalidation.org/  -->  <script src=\"assets/js/jquery.validate.min.js\" type=\"text/javascript\"></script></html>";
  var htmlfile = part1;

  var argv = {
    "tableName":"receipt_key_from",
    "key": req.query.comname,
    "condition": "mark=1"
  }

  var table_value = select(argv);
  table_value.then(function(ret) {
    console.log(ret);
    console.log(ret.length);
    for(var i = 0;i < ret.length;i ++) {
      htmlfile = htmlfile + "<div class=\"col-sm-12 col-sm-offset-1\"><div class=\"form-group\">";
      htmlfile = htmlfile + "<label class=\"col-sm-2\">" + ret[i].comname_from + "</label>";
      htmlfile = htmlfile + "<label class=\"col-sm-2\">" + ret[i].comname_to + "</label>";
      htmlfile = htmlfile + "<label class=\"col-sm-2\">" + getDate(BaseTime,parseInt(ret[i].start_date)) + "</label>";
      htmlfile = htmlfile + "<label class=\"col-sm-2\">" + getDate(BaseTime,parseInt(ret[i].end_date)) + "</label>";
      htmlfile = htmlfile + "<label class=\"col-sm-2\">" + ret[i].amount + "</label>";
      htmlfile = htmlfile + "</div></div>";
      console.log(ret[i].end_date);
    }
    var argv2 = {
      "tableName":"receipt_key_to",
      "key": req.query.comname,
      "condition": "mark=1"
    }

    var table_value2 = select(argv2);
    table_value2.then(function(ret) {
      console.log(ret);
      console.log(ret.length);
      for(var i = 0;i < ret.length;i ++) {
        htmlfile = htmlfile + "<div class=\"col-sm-12 col-sm-offset-1\"><div class=\"form-group\">";
        htmlfile = htmlfile + "<label class=\"col-sm-2\">" + ret[i].comname_from + "</label>";
        htmlfile = htmlfile + "<label class=\"col-sm-2\">" + ret[i].comname_to + "</label>";
        htmlfile = htmlfile + "<label class=\"col-sm-2\">" + getDate(BaseTime,parseInt(ret[i].start_date)) + "</label>";
        htmlfile = htmlfile + "<label class=\"col-sm-2\">" + getDate(BaseTime,parseInt(ret[i].end_date)) + "</label>";
        htmlfile = htmlfile + "<label class=\"col-sm-2\">" + ret[i].amount + "</label>";
        htmlfile = htmlfile + "</div></div>";
        console.log(ret[i].end_date);
      }
      htmlfile = htmlfile + part2;
      res.send(htmlfile);
    });
  })

})

app.get('/add_day',function(req,res) {
  var day = parseInt(req.query.add_day);
  var part1 = "<!doctype html><html lang=\"en\"><head>  <meta charset=\"utf-8\" />  <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge,chrome=1\" />  <link rel=\"apple-touch-icon\" sizes=\"76x76\" href=\"assets/img/apple-icon.png\" />  <link rel=\"icon\" type=\"image/png\" href=\"assets/img/favicon.png\" />  <title>Financial Chain Supply</title> <meta content=\'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0\' name=\'viewport\' />    <meta name=\"viewport\" content=\"width=device-width\" /> <!-- CSS Files -->    <link href=\"assets/css/bootstrap.min.css\" rel=\"stylesheet\" /> <link href=\"assets/css/paper-bootstrap-wizard.css\" rel=\"stylesheet\" />  <!-- CSS Just for demo purpose, don\'t include it in your project --> <link href=\"assets/css/demo.css\" rel=\"stylesheet\" />  <!-- Fonts and Icons -->    <link href=\"http://netdna.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.css\" rel=\"stylesheet\"> <link href=\'https://fonts.googleapis.com/css?family=Muli:400,300\' rel=\'stylesheet\' type=\'text/css\'> <link href=\"assets/css/themify-icons.css\" rel=\"stylesheet\"></head><body>  <div class=\"image-container set-full-height\" style=\"background-image: url(\'assets/img/paper-2.jpeg\')\">      <!--   Big container   -->      <div class=\"container\">         <div class=\"row\">           <div class=\"col-sm-12\">               <!--      Wizard container        -->               <div class=\"wizard-container\">                  <div>                             <input type=\'button\' class=\'btn btn-next btn-fill btn-primary\'  name=\'next\' value=\'Back to Index\' onclick=\"location=\'/index.html\'\"/>                      </div>                                      <div class=\"card wizard-card\" data-color=\"green\" id=\"wizard\">                   <!--        You can switch \" data-color=\"green\" \"  with one of the next bright colors: \"blue\", \"azure\", \"orange\", \"red\"       -->                         <div class=\"wizard-header\">                             <h3 class=\"wizard-title\">Current Date</h3>                          </div>                <div class=\"wizard-navigation\">                 <div class=\"progress-with-circle\">                      <div class=\"progress-bar\" role=\"progressbar\" aria-valuenow=\"1\" aria-valuemin=\"1\" aria-valuemax=\"4\" style=\"width: 50%;\"></div>                 </div>                  <ul>                                  <li>                      <a href=\"#location\" data-toggle=\"tab\">                        <div class=\"icon-circle\">                         <i class=\"ti-map\"></i>                        </div>                      </a>                    </li>                             </ul>               </div>                            <div class=\"tab-content\">                               <div class=\"tab-pane\" id=\"location\">                                  <div class=\"row\">                                     <div class=\"col-sm-5\">                                          <h5 class=\"info-text\"></h5>                                   </div>                                      <div class=\"col-sm-12\">                                         <div class=\"form-group\">                                              <label class=\"col-sm-8 col-sm-offset-5\"><p>";
  var part2 = "</p></label>                                                                                       </div>                                                  </div>                                                                                                            </div>                                </div>                            </div>                                                          </div>                </div> <!-- wizard container -->            </div>          </div> <!-- row -->     </div> <!--  big container -->      <div class=\"footer\">          <div class=\"container text-center\">             by Jenny          </div>      </div>  </div></body> <!--   Core JS Files   -->  <script src=\"assets/js/jquery-2.2.4.min.js\" type=\"text/javascript\"></script>  <script src=\"assets/js/bootstrap.min.js\" type=\"text/javascript\"></script> <script src=\"assets/js/jquery.bootstrap.wizard.js\" type=\"text/javascript\"></script> <!--  Plugin for the Wizard --> <script src=\"assets/js/paper-bootstrap-wizard.js\" type=\"text/javascript\"></script>  <!--  More information about jquery.validate here: http://jqueryvalidation.org/  -->  <script src=\"assets/js/jquery.validate.min.js\" type=\"text/javascript\"></script></html>";
  var html;
  if(!isNaN(day)) {
    var params=[day];
    // [ 'transferReceipt', 'addDay', 'queryReceipt', 'registerCompany' ]
    var functions = abi.filter(value => value.type === 'function').map(value => value.name);
    //console.log(functions);
    // registerCompany(comname,comaddress,comkind)
    var functionName = utils.spliceFunctionSignature(abi[1]);
    // send a transcation
    api.sendRawTransaction(SupplyChainAddr,functionName,params).then(function(value) {
        var curday = parseInt(value.output);
        console.log(curday);
        var CurDate = getDate(BaseTime,curday);
        html = part1 + CurDate + part2;
        res.send(html);
    });
  } else {
    res.redirect('/index');
  }
})



app.get('/index',function(req, res) {
  res.sendFile(__dirname + "/public/index.html");
})



app.get('/receipt', function (req, res) {
  res.sendFile(__dirname + "/public/receipt.html");
})  

app.get('/receipt_get', function(req,res) {
    // 输出 JSON 格式
  var response = {
     "comname_from":req.query.comname_from,
     "comname_to":req.query.comname_to,
     "amount":req.query.amount,
     "start_date":req.query.start_date,
     "end_date":req.query.end_date,
     "status":req.query.status
  };
  

  var part1 = "=\"icon\" type=\"image/png\" href=\"assets/img/favicon.png\" />  <title>Financial Chain Supply</title> <meta content=\'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0\' name=\'viewport\' />    <meta name=\"viewport\" content=\"width=device-width\" /> <!-- CSS Files -->    <link href=\"assets/css/bootstrap.min.css\" rel=\"stylesheet\" /> <link href=\"assets/css/paper-bootstrap-wizard.css\" rel=\"stylesheet\" />  <!-- CSS Just for demo purpose, don\'t include it in your project --> <link href=\"assets/css/demo.css\" rel=\"stylesheet\" />  <!-- Fonts and Icons -->    <link href=\"http://netdna.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.css\" rel=\"stylesheet\"> <link href=\'https://fonts.googleapis.com/css?family=Muli:400,300\' rel=\'stylesheet\' type=\'text/css\'> <link href=\"assets/css/themify-icons.css\" rel=\"stylesheet\"></head><body>  <div class=\"image-container set-full-height\" style=\"background-image: url(\'assets/img/paper-3.jpeg\')\">      <!--   Big container   -->      <div class=\"container\">         <div class=\"row\">           <div class=\"col-sm-8 col-sm-offset-2\">                <!--      Wizard container        -->               <div class=\"wizard-container\">            <div>                             <input type=\'button\' class=\'btn btn-next btn-fill btn-primary\'  name=\'next\' value=\'Back to Index\' onclick=\"location=\'/index.html\'\"/>                      </div>                                     <div class=\"card wizard-card\" data-color=\"azure\" id=\"wizard\">                   <!--        You can switch \" data-color=\"azure\" \"  with one of the next bright colors: \"blue\", \"green\", \"orange\", \"red\"           -->                         <div class=\"wizard-header\">                             <h3 class=\"wizard-title\">Receipt Information</h3>                             <p class=\"category\"> </p>                         </div>                <div class=\"wizard-navigation\">                 <div class=\"progress-with-circle\">                       <div class=\"progress-bar\" role=\"progressbar\" aria-valuenow=\"1\" aria-valuemin=\"1\" aria-valuemax=\"3\" style=\"width: 21%;\"></div>                  </div>                  <ul>                                  <li>                      <a href=\"#details\" data-toggle=\"tab\">                       <div class=\"icon-circle\">                         <i class=\"ti-list\"></i>                       </div>                        Receipt                     </a>                    </li>                             </ul>               </div>                            <div class=\"tab-content\">                               <div class=\"tab-pane\" id=\"details\">                                 <div class=\"row\">                                     <div class=\"col-sm-12\">                                         <h5 class=\"info-text\"> </h5>                                      </div>                                      <div class=\"col-sm-10 col-sm-offset-1\">                                         <div class=\"form-group\">                                              <label>Name of Borrowing Company</label>                                              <label class=\"col-sm-offset-1\"> ";
  var part2 = "</label>                                         </div>                                      </div>                                      <div class=\"col-sm-10 col-sm-offset-1\">                                         <div class=\"form-group\">                                              <label>Name of Loan Company: </label>                                             <label class=\"col-sm-offset-1\">";
  var part3 = "</label>                                         </div>                                      </div>                                                                            <div class=\"col-sm-10 col-sm-offset-1\">                                         <div class=\"form-group\">                                              <label>Start Date of Receipt:</label>                                             <label class=\"col-sm-offset-1\">";
  var part4 = "</label>                                         </div>                                      </div>                                      <div class=\"col-sm-10 col-sm-offset-1\">                                         <div class=\"form-group\">                                              <label>End Date of Receipt:</label>                                             <label class=\"col-sm-offset-1\">";
  var part5 = "</label>                                         </div>                                      </div>                                      <div class=\"col-sm-10 col-sm-offset-1\">                                       <div class=\"form-group\">                                              <label>Amount:</label>                                              <label  class=\"col-sm-offset-1\">";
  var part6 = " $</label>                                                                                           </div>                                      </div>                                  </div>                              </div>                                                </div>                </div> <!-- wizard container -->            </div>          </div> <!-- row -->     </div> <!--  big container -->      <div class=\"footer\">          <div class=\"container text-center\">              by Jenny         </div>      </div>  </div></body> <!--   Core JS Files   -->  <script src=\"assets/js/jquery-2.2.4.min.js\" type=\"text/javascript\"></script>  <script src=\"assets/js/bootstrap.min.js\" type=\"text/javascript\"></script> <script src=\"assets/js/jquery.bootstrap.wizard.js\" type=\"text/javascript\"></script> <!--  Plugin for the Wizard --> <script src=\"assets/js/paper-bootstrap-wizard.js\" type=\"text/javascript\"></script>  <!--  More information about jquery.validate here: http://jqueryvalidation.org/  -->  <script src=\"assets/js/jquery.validate.min.js\" type=\"text/javascript\"></script></html>";


  var start_date = DateDiff(BaseTime,req.query.start_date);
  var end_date = DateDiff(BaseTime,req.query.end_date);
  var params=[req.query.comname_from,req.query.comname_to,req.query.amount,start_date,end_date,req.query.status];  
  var functions = abi.filter(value => value.type === 'function').map(value => value.name);
  var functionName = utils.spliceFunctionSignature(abi[0]);


  var argv = {
    "tableName":"receipt_key_from",
    "key": req.query.comname_from,
    "condition": "comname_to="+ req.query.comname_to
  }
  var table_value = select(argv);
  var table_len;
  var flag = true;
  table_value.then(function(ret) {
    table_len = ret.length;
    for(var i = 0;i < ret.length;i ++) {
      if(parseInt(ret[i].end_date) == end_date && parseInt(ret[i].start_date) == start_date && parseInt(ret[i].amount) == parseInt(response.amount)) {
        flag = false;
        break;
      }
    }
  })


  if(response.status == "yes" && flag == true) {
    // send a transcation
    api.sendRawTransaction(SupplyChainAddr,functionName,params).then(function(value) {
      var table_value = select(argv);
      table_value.then(function(ret) {
        if(ret.length > table_len) {
          var htmlfile = part1 + response.comname_from + part2 + response.comname_to + part3 + response.start_date + part4 + response.end_date + part5 + response.amount + part6;
          res.send(htmlfile);
        }
        else {
          var wrong = "<p style=\"color: red\">wrong</p>"
          var htmlfile = part1 + wrong + part2 + wrong + part3 + wrong + part4 + wrong + part5 + wrong + part6;          
          res.send(htmlfile);
        }

      })
    });
  } else {
      var wrong = "<p style=\"color: red\">wrong</p>"
      var htmlfile = part1 + wrong + part2 + wrong + part3 + wrong + part4 + wrong + part5 + wrong + part6;          
      res.send(htmlfile);
  }

  
})

// function transferReceipt(string comname_from, string comname_to, int amount, int start_date, int end_date, string status)
 
app.get('/company_reg', function (req, res) {
  res.sendFile( __dirname + "/public/company_reg.html" );
})
 
app.get('/company_get', function (req, res) {
  var response = {
     "company_name":req.query.company_name,
     "company_address":req.query.company_address,
     "company_kind":req.query.company_kind
  };
  var params=[req.query.company_name,req.query.company_address,req.query.company_kind];
  // [ 'transferReceipt', 'addDay', 'queryReceipt', 'registerCompany' ]
  var functions = abi.filter(value => value.type === 'function').map(value => value.name);
  //console.log(functions);
  // registerCompany(comname,comaddress,comkind)
  var functionName = utils.spliceFunctionSignature(abi[3]);

  var part1 = "<!doctype html><html lang=\"en\"><head>  <meta charset=\"utf-8\" />  <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge,chrome=1\" />  <link rel=\"apple-touch-icon\" sizes=\"76x76\" href=\"assets/img/apple-icon.png\" />  <link rel=\"icon\" type=\"image/png\" href=\"assets/img/favicon.png\" />  <title>Financial Chain Supply</title> <meta content=\'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0\' name=\'viewport\' />    <meta name=\"viewport\" content=\"width=device-width\" /> <!-- CSS Files -->    <link href=\"assets/css/bootstrap.min.css\" rel=\"stylesheet\" /> <link href=\"assets/css/paper-bootstrap-wizard.css\" rel=\"stylesheet\" />  <!-- CSS Just for demo purpose, don\'t include it in your project --> <link href=\"assets/css/demo.css\" rel=\"stylesheet\" />  <!-- Fonts and Icons -->    <link href=\"http://netdna.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.css\" rel=\"stylesheet\"> <link href=\'https://fonts.googleapis.com/css?family=Muli:400,300\' rel=\'stylesheet\' type=\'text/css\'> <link href=\"assets/css/themify-icons.css\" rel=\"stylesheet\"></head><body>  <div class=\"image-container set-full-height\" style=\"background-image: url(\'assets/img/paper-1.jpeg\')\">      <!--   Big container   -->      <div class=\"container\">         <div class=\"row\">           <div class=\"col-sm-8 col-sm-offset-2\">                <!--      Wizard container        -->               <div class=\"wizard-container\">            <div>                             <input type=\'button\' class=\'btn btn-next btn-fill btn-warning btn-wd\' name=\'next\' value=\'Back to Index\' onclick=\"location=\'/index.html\'\"/>                      </div>                   <div class=\"card wizard-card\" data-color=\"orange\" id=\"wizardProfile\">                   <!--        You can switch \" data-color=\"orange\" \"  with one of the next bright colors: \"blue\", \"green\", \"orange\", \"red\", \"azure\"          -->                          <div class=\"wizard-header text-center\">                             <h3 class=\"wizard-title\">Company Information</h3>                         </div>                <div class=\"wizard-navigation\">                 <div class=\"progress-with-circle\">                       <div class=\"progress-bar\" role=\"progressbar\" aria-valuenow=\"1\" aria-valuemin=\"1\" aria-valuemax=\"3\" style=\"width: 21%;\"></div>                  </div>                  <ul>                                  <li>                      <a href=\"#about\" data-toggle=\"tab\">                       <div class=\"icon-circle\">                         <i class=\"ti-user\"></i>                       </div>                        Company Information                     </a>                    </li>                                                               </ul>               </div>                            <div class=\"tab-content\">                               <div class=\"tab-pane\" id=\"about\">                                 <div class=\"row\">                     <h5 class=\"info-text\"> </h5>                      <div class=\"col-sm-10 col-sm-offset-1\">                       <div class=\"form-group\">                          <label>Company Name: </label>                         <label  class=\"col-sm-offset-1\">";
  var part2 = "</label>                       </div>                      </div>                      <div class=\"col-sm-10 col-sm-offset-1\">                       <div class=\"form-group\">                          <label>Company Address: </label>                          <label  class=\"col-sm-offset-1\">";
  var part3 = "</label>                                           </div>                      </div>                      <div class=\"col-sm-10 col-sm-offset-1\">                       <div class=\"form-group\">                          <label>Company Type: </label>                         <label  class=\"col-sm-offset-1\">";
  var part4 = "</label>                                           </div>                      </div>                                          </div>                                </div>                                                      </div>                                              </div>                </div> <!-- wizard container -->            </div>        </div><!-- end row -->    </div> <!--  big container -->      <div class=\"footer\">          <div class=\"container text-center\">           by Jenny          </div>      </div>  </div></body> <!--   Core JS Files   -->  <script src=\"assets/js/jquery-2.2.4.min.js\" type=\"text/javascript\"></script>  <script src=\"assets/js/bootstrap.min.js\" type=\"text/javascript\"></script> <script src=\"assets/js/jquery.bootstrap.wizard.js\" type=\"text/javascript\"></script> <!--  Plugin for the Wizard --> <script src=\"assets/js/paper-bootstrap-wizard.js\" type=\"text/javascript\"></script>  <script src=\"assets/js/company_table.js\" type=\"text/javascript\"></script> <!--  More information about jquery.validate here: http://jqueryvalidation.org/  -->  <script src=\"assets/js/jquery.validate.min.js\" type=\"text/javascript\"></script></html>";

  // send a transcation
  api.sendRawTransaction(SupplyChainAddr,functionName,params).then(function(value) {
      console.log(value);
      var htmlfile;
      if(parseInt(value.output) == 0) {
        htmlfile = part1 + response.company_name + part2 + response.company_address + part3 + response.company_kind + part4;
      } else {
        var wrong = "<p style=\"color: red\">wrong</p>"
        htmlfile = part1 + wrong + part2 + wrong + part3 + wrong + part4;
      }
      res.send(htmlfile);        
  });

})
 
var server = app.listen(8081, function () {
 
  var host = server.address().address
  var port = server.address().port
 
  console.log("Financial Chain Supply is running on 127.0.0.1/8081...")
 
})

