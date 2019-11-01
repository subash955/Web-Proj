express = require("express")


var request = require('request');
var passport = require("passport")

var nodemailer = require('nodemailer')

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "testperson383@gmail.com",
      pass: "TestPerson123"
    }
  });


var cron = require('node-cron')
var d = new Date();
var weekday = new Array(7);
weekday[0] =  "sunday";
weekday[1] = "monday";
weekday[2] = "tuesday";
weekday[3] = "wednesday";
weekday[4] = "thursday";
weekday[5] = "friday";
weekday[6] = "saturday";
var n = weekday[d.getDay()]

const { Pool, Client } = require('pg')
const bcrypt= require('bcrypt')
const LocalStrategy = require('passport-local').Strategy;


const pool = new Pool({
  user: 'subash',
  host: 'localhost',
  database: 'login_details',
  port: 5432,
})


app = express()




const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.set("view engine", "ejs")
app.use(express.static(__dirname + '/views'))



app.use(require("express-session")({
    secret: 'keyboard cat',
resave: false,
saveUninitialized: false,
cookie:
{
    secure: false,
    maxAge: 3600000
}}))

app.use(passport.initialize());
app.use(passport.session());

var ourvar = false
var notcorrect = false


app.get("/login", function(req,res)
{   
   console.log(ourvar)
   res.render("test" , {exists : ourvar, Incorrect : notcorrect})
   ourvar = false
   notcorrect = false
})

app.post('/login',	passport.authenticate('local' ,{
    successRedirect: '/profile',
    failureRedirect: '/login'
}), function(req, res) {
      req.session.cookie.expires = false;
    }
);

app.get("/forgot", function(req,res)
{
    res.render("forgot_password")
})

app.get("/logout", function(req,res)
{
    req.logout()
    res.redirect('/login')
})

app.get("/register", function(req,res)
{
    res.render("sign_up")
})

app.post("/register", async function(req,res)
{

    try{
        const client = await pool.connect()
        await client.query("BEGIN")
        var pwd = await bcrypt.hash(req.body.password, 5);
      
        client.query('INSERT INTO users (email, password,first_name) VALUES ($1,$2, $3)', [req.body.email, pwd, req.body.name], function(err, result) {
        
        if(err){
        console.log(err.code)
        if(err.code == '23505'){
            ourvar = true
            res.redirect('/login') 
        }
        }
        else {
        
        client.query('COMMIT')
        console.log(result)
        res.redirect("/login");
        return;
        }})
        
        client.release()
    
       
        
 
    }
    catch(e){
        console.log("Error")
        throw(e)}
});

app.post("/create", async function(req,res)
{

    try{
        const client = await pool.connect()
        await client.query("BEGIN")
      
        client.query('INSERT INTO grouplist (group_id, group_pass) VALUES ($1,$2)', [req.body.groupid, req.body.grouppass], function(err, result) {
        client.query('INSERT INTO user_groups (useremail, groupname) VALUES ($1,$2)', [req.user.email, req.body.groupid])

        if(err){
        console.log(err.code)
        if(err.code == '23505'){
            ourvar = true
            res.redirect('/login') 
        }
        }
        else {
        
        client.query('COMMIT')
        console.log(result)
        res.redirect("/login");
        return;
        }})

        client.release()
    
       
        
 
    }
    catch(e){
        console.log("Error")
        throw(e)}
});


app.post("/join", async function(req,res)
{

    try{
        const client = await pool.connect()
        await client.query("BEGIN")

        client.query("SELECT * FROM grouplist WHERE group_id=$1", [req.body.groupname], async function(err,result){
            if (result.rows.length == 0)
            {   
                console.log(result.rows)
                console.log("group does not exist")
                return
            }
            else (result.rows.length > 0)
             {   
                 client.query("SELECT * FROM user_groups  WHERE useremail = 'jointest@jointest.com' AND groupname = 'test4group'", async function(err,quer)
                {
                    if (quer.rows.length != 0)
                    {
                        console.log('Already Exists!!')
                        return
                    }
                    else
                    {    
                    if (req.body.grouppwd== result.rows[0].group_pass)
                    {
                        console.log(result.rows.length)
                        client.query('INSERT INTO user_groups (useremail, groupname) VALUES ($1,$2)', [req.user.email, req.body.groupname])
                        console.log('Joined Group')
                        
                    }
                    else
                    {
                        console.log('incorrect pwd')
                    }       
                    }     
                })}
            client.query('COMMIT')            
            })
            client.release()
    }
    catch(e){
        console.log("Error")
        throw(e)}
        res.redirect("/profile");
});

app.get("/create",function(req,res, next)
{  
    if (req.isAuthenticated())
    {
    
    res.render("create", {islogin : req.isAuthenticated()})
    }
    else res.send ("NOT LOGGED IN")
})


app.get("/chore", async function(req,res)
{  
    if (req.isAuthenticated())
    {
        const client = await pool.connect()
        await client.query("BEGIN")

        client.query("SELECT * FROM user_groups WHERE useremail=$1", [req.user.email], function(err,result){
            res.render("chore", {islogin : req.isAuthenticated(), data: result.rows})
            })
            
            client.release()
    }
    
    else res.send ("NOT LOGGED IN")
})

app.post("/chore", async function(req,res)
{
    const client = await pool.connect()
    await client.query("BEGIN")
    console.log
    client.query("INSERT INTO chore_list (chore, chore_group) VALUES ($1,$2)", [req.body.choreid,req.body.group_n],function(err,result){
       console.log(result)
    }
    )
    client.query('COMMIT')
    client.release
    res.redirect("/profile")
})

app.get("/profile",async function(req,res, done)
{  
    
    if (req.isAuthenticated())
    {
        const client = await pool.connect()
            
            try{

            client.query("BEGIN", function(err,result)
            {
                if(err)
                {console.log(err)}
            })
            
            client.query("SELECT * FROM user_groups WHERE useremail=$1", [req.user.email], function(err,result)
            {
                if (err)
                {console.log(err)}
                client.query("SELECT * FROM chore_list WHERE sunday=$1 OR monday=$1 OR tuesday=$1 OR wednesday=$1 OR thursday = $1 or friday = $1 or saturday = $1", [req.user.email], function(err,res2)
                {
                    if (err)
                    {console.log(err)}
                    console.log(res2)
                    res.render("auth", {name : req.user.name, islogin : req.isAuthenticated(), data: result.rows, chdata: res2.rows})
                })
            
                
            })
        }
        catch(e){
            throw(Error(e))
        }
    client.release()
    }
    else res.send ("NOT LOGGED IN")
    
})

app.get("/profile/:grpname", async function(req,res)
{
    const client = await pool.connect()

    try{
    await client.query("BEGIN")
    
    
     
    client.query("SELECT * FROM grouplist WHERE group_id=$1", [req.params.grpname],function(err,result){
        if (result.rows.length != 0)
    {client.query("SELECT * FROM chore_list WHERE chore_group=$1", [req.params.grpname], function(err,result){
        
        
        res.render('grouppage', {islogin : req.isAuthenticated(),name : req.user.name, grup : req.params.grpname, data : result.rows })
        })
    client.release()}
    
    else
    {
        res.send("GROUP DOES NOT EXIST")
        client.release()
    }
    
    })


}
catch(e)
{
    console.log('ERROR')
    console.log(e)
    throw(e)
}}
)

app.get("/profile/:grpname/:chorename", async function(req,res)
{
    const client = await pool.connect()

    try{
    await client.query("BEGIN")
    client.query("SELECT * FROM chore_list WHERE chore=$1 AND chore_group=$2", [req.params.chorename, req.params.grpname],function(err,result){
        if (result.rows.length != 0)
    {
        res.render('chorepage', {islogin : req.isAuthenticated(),name : req.user.name, chre : req.params.chorename, data : result.rows, grp: req.params.grpname})
    
    }
    else
    {
        res.send("GROUP DOES NOT EXIST")
       
    }
    
    })


}
catch(e)
{
    console.log('ERROR')
    console.log(e)
    throw(e)
} client.release()}
)

app.post("/profile/:grpname/:chorename", async function(req,res)
{
    console.log("HELLO")
    console.log(req.body.choseday.toLowerCase())
    const client = await pool.connect()
    try{
        
        
        await client.query("BEGIN")
        if (req.body.choseday == 'Sunday')
        {
        client.query("UPDATE chore_list SET sunday = $1  WHERE chore = $2",[req.user.email, req.params.chorename] , function(err,result)
        {if (err)
            {console.log(err)
            console.log("GOODBYE")}
           
        }
        )}
        else if (req.body.choseday == 'Monday')
        {
        client.query("UPDATE chore_list SET monday = $1  WHERE chore = $2",[req.user.email, req.params.chorename] , function(err,result)
        {if (err)
            {console.log(err)
            console.log("GOODBYE")}
           
        }
        )}

        else if (req.body.choseday == 'Tuesday')
        {
        client.query("UPDATE chore_list SET tuesday = $1  WHERE chore = $2",[req.user.email, req.params.chorename] , function(err,result)
        {if (err)
            {console.log(err)
            console.log("GOODBYE")}
           
        }
        )}

        else if (req.body.choseday == 'Wednesday')
        {
        client.query("UPDATE chore_list SET wednesday = $1  WHERE chore = $2",[req.user.email, req.params.chorename] , function(err,result)
        {if (err)
            {console.log(err)
            console.log("GOODBYE")}
           
        }
        )}

        else if (req.body.choseday == 'Thursday')
        {
        client.query("UPDATE chore_list SET thursday = $1  WHERE chore = $2",[req.user.email, req.params.chorename] , function(err,result)
        {if (err)
            {console.log(err)
            console.log("GOODBYE")}
           
        }
        )}

        else if (req.body.choseday == 'Friday')
        {
        client.query("UPDATE chore_list SET friday = $1  WHERE chore = $2",[req.user.email, req.params.chorename] , function(err,result)
        {if (err)
            {console.log(err)
            console.log("GOODBYE")}
           
        }
        )}

        else if (req.body.choseday == 'Saturday')
        {
        client.query("UPDATE chore_list SET saturday = $1  WHERE chore = $2",[req.user.email, req.params.chorename] , function(err,result)
        {if (err)
            {console.log(err)
            console.log("GOODBYE")}
           
        }
        )}


    }
    catch(e)
    {console.log(e)}
    client.query("COMMIT")
client.release()
res.redirect('/profile/' + [req.params.grpname])
})

    


app.get("*", function(req,res)
{
    res.redirect('/login')
})



passport.use('local', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true // allows us to pass back the entire request to the callback
},
    async function(req, email, password, done) {
         const client = await pool.connect()
        await client.query("BEGIN")
        aval = false
        client.query("SELECT * from users where email=$1", [email], function(err, result){
            if(err){
                notcorrect = true
                return done(err);
            }
            if (result.rows.length == 0)
            {
                notcorrect = true
                console.log("email does not exist")
                return done(null,false)
            }
            else (result.rows.length > 0)
            {    
             bcrypt.compare(password, result.rows[0].password, function(err, check) {
                 if (err){
                     console.log('Error while checking password');
                     return done();
                 }
                 else if (check)
                 {console.log('correct password')
                 return done(null, {email: result.rows[0].email,name: result.rows[0].first_name})
                }
                else{
                    console.log('danger', "Oops. Incorrect login details.");
                    notcorrect = true
                    return done(null, false);
                }
            })
        }

        })
    })
    
)




passport.serializeUser(function(user, done) {
    console.log('serializing user: ');
    console.log(user);
	done(null, user);
});

passport.deserializeUser(function(user, done) {
	done(null, user);
});	


cron.schedule("0 0 0 * *", async function() {
    const client = await pool.connect()
    await client.query("BEGIN")
    client.query("SELECT chore, " + n + " FROM chore_list", function(err, result)
    {
        if (err)
        {
            console.log(err)
        }
    else
    {
        for (var i = 0; i < result.rows.length; i++)
        {
            if(result.rows[i][n])
            {
                let mailOptions = {
                    from: "testperson383@gmail.com",
                    to: result.rows[i][n],
                    subject: "Reminder",
                    text: "Hi there, you have " + result.rows[i].chore + " coming up today!"
                  };
                  transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                      throw error;
                    } else {
                      console.log("Email successfully sent!");
                    }
                  });
            }
        }
    }
    })
  });

app.listen(3000,process.env.IP, function()
{
    console.log('Server Has Started!')
})


