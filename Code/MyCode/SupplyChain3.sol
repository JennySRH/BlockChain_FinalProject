pragma solidity ^0.4.24;

import "./Table.sol";
contract SupplyChain3{
    //using strings for *;
    // event
    event RegisterEvent(int256 ret, string comname, string comaddress, string comkind);
    event TransferEvent(int256 ret, string comname_from, string comname_to, int amount, int start_date, int end_date, string status);
    
    // current_time
    int private current_date = 0;
    // comname array
    string[200] comname_arr;
    uint cnt = 0;
    
    constructor() public {
        createTable();
    }

    function createTable() private {
        TableFactory tf = TableFactory(0x1001);  // the address of TableFactory is 0x1001
        // company table [key: comname]
        tf.createTable("company_reg", "comname", "comaddress, comkind, mark");
        // receiptfrom table [key: comname_from]
        tf.createTable("receipt_key_from", "comname_from" , "comname_to, amount, start_date, end_date, status, mark");
        // receiptto Table  [key comname_to]
        tf.createTable("receipt_key_to", "comname_to",  "comname_from, amount, start_date, end_date , status, mark");
        // the receipfrom and receiptto are the same, the key of the two tables are differenct
    }

    function openCompanyTable() private returns(Table) {
        TableFactory tf = TableFactory(0x1001);
        Table table = tf.openTable("company_reg");
        return table;
    }
    
    function openReceiptFromTable() private returns(Table) {
        TableFactory tf = TableFactory(0x1001);
        Table table = tf.openTable("receipt_key_from");
        return table;
    }

    function openReceiptToTable() private returns(Table){
        TableFactory tf = TableFactory(0x1001);
        Table table = tf.openTable("receipt_key_to");
        return table;
    }


    function checkCompanyName(string comname) private constant returns(int256) {
        // open table
        Table table = openCompanyTable();
        // query
        Entries entries = table.select(comname, table.newCondition());
        if (0 == uint256(entries.size())) {
            return -1;
        } else {
            return 0;
        }
    }
    
    
    
    function checkReceipt(string comname_from, string comname_to, int amount, int start_date, int end_date) private constant returns(int256) {
        // check whether the company exists
        if(checkCompanyName(comname_from) != 0 || checkCompanyName(comname_to) != 0) {
            return 0;
        }
        
        
        // open table
        Table tableto = openReceiptToTable();
        Table tablefrom = openReceiptFromTable();
        Condition condition = tableto.newCondition();
        condition.EQ("comname_from", comname_from);
        condition.EQ("comname_to", comname_to);
        condition.EQ("amount", amount);
        condition.EQ("start_date", start_date);
        condition.EQ("end_date", end_date);

        // query
        Entries entriesto = tableto.select(comname_to, condition);
        Entries entriefrom = tablefrom.select(comname_from, condition);
        if (0 == uint256(entriesto.size()) && 0 == uint256(entriefrom.size())) {
            return -1;
        } else {
            return 0;
        }
    }
    

    /*
    description : register a company
    parameters £º 
            comname : company name
            comaddress  : company address
            comkind : company kind
    return values£º
            0  register success
            -1 company exists
            -2 other errors
    */
    function registerCompany(string comname, string comaddress, string comkind) public returns(int256) {
        int256 ret_code = 0;
        int256 ret= 0;
        // check whether the company exists
        ret = checkCompanyName(comname);
        // if not exists
        if(ret != 0) {
            Table table = openCompanyTable();
            Entry entry = table.newEntry();
            entry.set("comname", comname);
            entry.set("comaddress", comaddress);
            entry.set("comkind",comkind);
            entry.set("mark","1");
            // insert
            int count = table.insert(comname, entry);
            if (count == 1) {
                // success
                comname_arr[cnt] = comname;
                cnt++;
                ret_code = 0;
            } else {
                // fail
                ret_code = -2;
            }
        } else {
            // if exists or company not exists
            ret_code = -1;
        }

        emit RegisterEvent(ret_code, comname, comaddress, comkind);
        return ret_code;
    }


    /*
    description : add a receipt
    parameters £º 
            comname_from : borrower name
            comname_to   : creditor name
            amount       : amount
            start_date   : borrow time
            end_date     : return time
            status       : wheter recognized by bank
    return values£º
            0  register success
            -1 receipt exists
            -2 other errors
    */
    function addReceipt(string comname_from, string comname_to, int amount, int start_date, int end_date, string status) private returns  (int256){ 
        int256 ret_code = 0;
        int256 ret= 0;
        // check whether the receipt exists
        ret = checkReceipt(comname_from, comname_to, amount, start_date, end_date);
        // if not exists
        if(ret != 0) {
            Table tablefrom = openReceiptFromTable();
            Table tableto = openReceiptToTable();
            Entry entry = tablefrom.newEntry();
            entry.set("comname_from", comname_from);
            entry.set("comname_to", comname_to);
            entry.set("amount", amount);
            entry.set("start_date", start_date);
            entry.set("end_date", end_date);
            entry.set("mark","1");

            // insert
            int count1 = tablefrom.insert(comname_from, entry);
            int count2 = tableto.insert(comname_to, entry);
            if (count1 == 1 && count2 == 1) {
                // success
                ret_code = 0;
            } else {
                // fail
                ret_code = -2;
            }
        } else {
            // if exists
            ret_code = -1;
        }

        emit TransferEvent(ret_code, comname_from, comname_to, amount, start_date, end_date, status);
        return ret_code;
    }
    
    /*
    description : update a receipt
    parameters £º 
            comname_from : borrower name
            comname_to   : creditor name
            amount       : amount
            start_date   : borrow time
            end_date     : return time
            new_amount    : new amount
            new_end_date : new return time
    return values£º
            0  update success
            -2 other errors
    */
    function updateReceipt(string comname_from, string comname_to, int amount, int start_date, int end_date, int new_amount, int new_end_date) private returns  (int256){ 
        int256 ret_code = 0;
        Table tablefrom = openReceiptFromTable();
        Table tableto = openReceiptToTable();
        Entry entry = tablefrom.newEntry();
        entry.set("comname_from", comname_from);
        entry.set("comname_to", comname_to);
        entry.set("amount", new_amount);
        entry.set("start_date", start_date);
        entry.set("end_date", new_end_date);
        entry.set("mark","1");

        Condition condition = tablefrom.newCondition();
        condition.EQ("comname_from", comname_from);
        condition.EQ("comname_to", comname_to);
        condition.EQ("amount", amount);
        condition.EQ("start_date", start_date);
        condition.EQ("end_date", end_date);
        
        // update
        if (tablefrom.update(comname_from, entry, condition) == 1 && tableto.update(comname_to, entry, condition) == 1) {
            // success
            ret_code = 0;
        } else {
            // fail
            ret_code = -2;
        }
        return ret_code;
    }
    
    
    
    /*
    description : delete a receipt
    parameters £º 
            comname_from : borrower name
            comname_to   : creditor name
            amount       : amount
            start_date   : borrow time
            end_date     : return time
    return values£º
            0  delete success
            -2 other errors
    */
    function deleteReceipt(string comname_from, string comname_to, int amount, int start_date, int end_date) private returns  (int256){ 
        int256 ret_code = 0;
        Table tablefrom = openReceiptFromTable();
        Table tableto = openReceiptToTable();
        
        Condition condition = tablefrom.newCondition();
        condition.EQ("comname_from", comname_from);
        condition.EQ("comname_to", comname_to);
        condition.EQ("amount", amount);
        condition.EQ("start_date", start_date);
        condition.EQ("end_date", end_date);
        
        // delete
        int count1 = tablefrom.remove(comname_from, condition);
        int count2 = tableto.remove(comname_to, condition);
        if (count1 == 1 && count2 == 1) {
            // success
            ret_code = 0;
        } else {
            // fail
            ret_code = -2;
        }
        return ret_code;
    }
    
    
    /*
    description : transfer a receipt
    parameters £º 
            comname_from : borrower name
            comname_to   : creditor name
            amount       : amount
            start_date   : borrow time
            end_date     : return time
            status       : wheter recognized by bank
    */
    
    function transferReceipt(string comname_from, string comname_to, int amount, int start_date, int end_date, string status) public { 
        Table tablefrom = openReceiptFromTable();
        Entries entriesto = tablefrom.select(comname_to, tablefrom.newCondition());
        Entry tmp;
        int new_end_date;
        int tmp_new_amount;
        for(int i = 0;i < entriesto.size();i++) {
            if(amount == 0) {
                break;
            }
            tmp = entriesto.get(i);
            new_end_date = tmp.getInt("end_date") < end_date ? tmp.getInt("end_date") : end_date;
            if(tmp.getInt("amount") == amount) {
                // earlest end_date
                addReceipt(comname_from, tmp.getString("comname_to"), amount, start_date, new_end_date, status);
                break;
            }
            else if(tmp.getInt("amount") > amount) {
                tmp_new_amount = tmp.getInt("amount") - amount;
                updateReceipt(tmp.getString("comname_from"), tmp.getString("comname_to"), tmp.getInt("amount"), tmp.getInt("start_date"), tmp.getInt("end_date"), tmp_new_amount, tmp.getInt("end_date"));
                addReceipt(comname_from, tmp.getString("comname_to"), amount, start_date, new_end_date, status);
                break;
            }
            else {
                amount = amount - tmp.getInt("amount");
                addReceipt(comname_from, tmp.getString("comname_to"), tmp.getInt("amount"), start_date, new_end_date, status);
                deleteReceipt(tmp.getString("comname_from"),tmp.getString("comname_to"),tmp.getInt("amount"),tmp.getInt("start_date"),tmp.getInt("end_date"));

            }
        }
        if(amount > 0) {
            addReceipt(comname_from, comname_to, amount, start_date, end_date, status);
        }
    }

    
    
    /*
    description : query a company's receipts
    parameters £º 
            comname : company name
    return values£º
            Entries entriesfrom :  borrower receipts
            Entries entriesto   :  creditor receipts
            int amount          :  amount
    */
    
    function queryReceipt(string comname) public returns (int){ 
        Table tablefrom = openReceiptFromTable();
        Table tableto = openReceiptToTable();
        Entries entriesfrom = tablefrom.select(comname, tablefrom.newCondition());
        Entries entriesto = tableto.select(comname, tableto.newCondition());
        int amount = 0;
        for(int i = 0;i < entriesfrom.size();i ++) {
            amount = amount - entriesfrom.get(i).getInt("amount");
        }
        for(int j = 0;j < entriesto.size();j ++) {
            amount = amount + entriesto.get(i).getInt("amount");
        }
        return (amount);
    }

    /*
    description : remove a receipt
    parameters £º comname : company name
    return values£º
    */
    function removeReceiptDate(string comname) private {
        
        Table tablefrom = openReceiptFromTable();
        Table tableto = openReceiptToTable();
        Condition condition = tablefrom.newCondition();
        condition.LT("end_date", current_date);
        tablefrom.remove(comname,condition);
        tableto.remove(comname,condition);
    }
    

    /*
    description : add current_date
    parameters £º 
    return values£º
    */
    
    function addDay(int new_days) public returns(int){
        current_date = current_date + new_days;
        for(uint k = 0; k < cnt; k++) {
            removeReceiptDate(comname_arr[k]);
        }
        return current_date;
    }
    
    
}
