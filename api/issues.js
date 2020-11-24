const express = require('express');
const sqlite3 = require('sqlite3');

const issueRouter = express.Router({mergeParams: true});

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

issueRouter.param('issueId', (req, res, next, issueId) => {
    db.get('SELECT * FROM Issue WHERE id = $id', 
    {$id: issueId},
    (err, row) => {
        if(err){
            next(err);
        } else if (row){
            next();
        } else {
            return res.status(404).send();
        }
    })
});


issueRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Issue WHERE series_id = $seriesId', 
    {$seriesId: req.params.seriesId}, 
    (err, rows) => {
        if(err){
            next(err);
        } else {
            res.status(200).send({issues: rows});
        }
    })
});


issueRouter.post('/', (req, res, next) => {
    const name = req.body.issue.name;
    const issueNumber = req.body.issue.issueNumber;
    const publicationDate = req.body.issue.publicationDate;
    const artistId = req.body.issue.artistId;
    
    db.get('SELECT * FROM Artist WHERE id = $artistId',
        {$artistId: artistId},
        (err, artist) => {
            if(err){
                next(err);
            } else {
                 if (!name || !issueNumber || !publicationDate || !artist) {
                    return res.status(400).send();
                }
          

            db.run(`INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id)
            VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)`,
                {
                $name: name,
                $issueNumber: issueNumber,
                $publicationDate: publicationDate,
                $artistId: artistId,
                $seriesId: req.params.seriesId
                }, function(err) {
                    if(err) {
                        next(err);
                    } else {
                        db.get(`SELECT * FROM Issue WHERE id = ${this.lastID}`,
                            (err, row) => {
                                res.status(201).send({issue: row});
                            }
                        );
                    }
                }
            );
        }
    
    });
});

issueRouter.put('/:issueId', (req, res, next) => {
    const name = req.body.issue.name;
    const issueNumber = req.body.issue.issueNumber;
    const publicationDate = req.body.issue.publicationDate;
    const artistId = req.body.issue.artistId;

    if (!name || !issueNumber || !publicationDate || !artistId) {
        return res.status(400).send();
    }

    db.serialize( () => {


        db.get('SELECT * FROM Issue WHERE id = $issueId',
        {$issueId: req.body.issue.id},
        (err, row) => {
            if(err){
                next(err);
            } else if(!row) {
                return res.status(404).send;
            }
        });

        db.get('SELECT * FROM Artist WHERE id = $artistId',
        {$artistId: artistId},
        (err, row) => {
            if(err){
                next(err);
            } else if(!row) {
                return res.status(400).send;
            }
        });

        db.run('UPDATE Issue SET name = $name, issue_number = $issueNumber, publication_date = $publicationDate, artist_id = $artistId',
        {
            $name: name,
            $issueNumber: issueNumber,
            $publicationDate: publicationDate,
            $artistId: artistId
        }, 
        err => {
            if(err){
                next(err);
            }
        });

        db.get(`SELECT * FROM Issue WHERE id = ${req.params.issueId}`,
        (err, row) => {
            res.status(200).send({issue: row});
        });
    });
});


issueRouter.delete('/:issueId', (req, res, next) => {

    db.run(`DELETE FROM Issue WHERE id = ${req.params.issueId}`,
        err => {
            if(err){
                next(err);
            } else {
                res.status(204).send();
            }
        } 
    );
});




module.exports = issueRouter;