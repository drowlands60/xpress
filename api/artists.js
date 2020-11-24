const errorHandler = require('errorhandler');
const express = require('express');
const sqlite3 = require('sqlite3');

const artistRouter = express.Router();

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

artistRouter.param('artistId', (req, res, next, artistId) => {
    db.get('SELECT * FROM Artist WHERE id = $id',
    {$id: artistId},
    (err, row) => {
        if(err){
            next(err);
        } else if(row) {
            req.artist = row;
            next();
            } else {
                return res.status(404).send();
            }
        
        }
    );
});

artistRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Artist WHERE is_currently_employed = 1', (err, rows) => {
        if(err){
            next(err);
        } else {
            res.status(200).json({artists: rows});
        }
    });
});

artistRouter.get('/:artistId', (req, res, next) => {
    res.status(200).json({artist: req.artist});
});

artistRouter.post('/', (req, res, next) => {
    const artistToAdd = req.body.artist;

    if (!artistToAdd.name || !artistToAdd.dateOfBirth || !artistToAdd.biography) {
            return res.status(400).send();
        } 

    if (artistToAdd.is_currently_employed === 0){
        artistToAdd.is_currently_employed = 0;
    } else {
        artistToAdd.is_currently_employed = 1;
    };

    db.run(`INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $dob, $bio, $employed)`,
    {
        $name: artistToAdd.name,
        $dob: artistToAdd.dateOfBirth,
        $bio: artistToAdd.biography,
        $employed: artistToAdd.is_currently_employed
    },
    function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Artist WHERE Artist.id = $id`, 
            {
                $id: this.lastID
            },
            (err, row) => {
                res.status(201).send({artist: row});
            })  
        }
    });
});

artistRouter.put('/:artistId', (req, res, next) => {
    const name = req.body.artist.name;
    const dateOfBirth = req.body.artist.dateOfBirth;
    const biography = req.body.artist.biography;
    let employed = req.body.artist.is_currently_employed;

    if (employed === 0){
        employed = 0;
    } else {
        employed = 1;
    };

    if (!name || !dateOfBirth || !biography){
        res.status(400).send();
    };

    db.run('UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, biography = $biography, is_currently_employed = $employed WHERE id = $id',
    {
        $name: name,
        $dateOfBirth: dateOfBirth,
        $biography: biography,
        $employed: employed,
        $id: req.params.artistId
    }, err => {
        if(err){
            next(err);
        } else {
            db.get(`SELECT * From Artist WHERE id = ${req.params.artistId}`, (err, row) =>{
                res.status(200).send({artist:row});
            });
        }
    }
    );
});

artistRouter.delete('/:artistId', (req, res, next) => {

    db.run('UPDATE Artist SET is_currently_employed = 0 WHERE id = $id', 
    {
        $id: req.params.artistId
    }, err => {
        if (err) {
            next(err);
        } else {
           db.get(`SELECT * FROM Artist WHERE id = ${req.params.artistId}`, (err, row) => {
               res.status(200).send({artist:row});
           }); 
        }
    }
    )
});

module.exports = artistRouter;