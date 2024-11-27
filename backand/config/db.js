const mongoose  = require('mongoose')
const ConnectDb = async() => {
    try {
        const db = await mongoose.connect('mongodb+srv://contactdigiposterpro:contactdigiposterpro@cluster0.6ofog.mongodb.net/Digiposterpro_App')
        console.log(`Mongodb Connected : --  ${db.connection.host}`);
    } catch (error) {
        console.log(error);
    }
}
module.exports = ConnectDb