const express = require('express');
const sqlite3 = require('sqlite3');
const issueRouter = require('./issues')

const seriesRouter = express.Router();

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');


seriesRouter.param('seriesId', (req, res, next, seriesId) => {
    db.get('SELECT * FROM Series WHERE id = $id', 
        {$id: seriesId},
        (err, row) => {
            if (err) {
                next(err);
            } else if (row) {
                req.series = row;
                next();
            } else {
                res.status(404).send();
            }
        }
    );
});

seriesRouter.use('/:seriesId/issues', issueRouter);

seriesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Series', (err, rows) => {
        if (err){
            next(err);
        } else {
            res.status(200).send({series: rows});
        }
    });
});

seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).send({series: req.series});
});

seriesRouter.post('/:seriesId', (req, res, next) => {
    const name = req.body.series.name;
    const description = req.body.series.description;

    if(!name || !description) {
        return res.status(400).send();
    } 
    
    db.run('INSERT INTO SERIES (name, description) VALUES ($name, $description)',
        {$name: name, $description: description},
        err => {
            if(err){
                next(err);
            } else {
                db.get(`SELECT * FROM SERIES WHERE id = ${this.lastID}`, 
                    (err, row) => {
                        res.status(201).send({series: row});
                    }
                );
            }
        }
    );
    
});

seriesRouter.put('/:seriesId', (req, res, next) => {
    const name = req.body.series.name;
    const description = req.body.series.description;

    if(!name || !description) {
        return res.status(400).send();
    }

    db.run('UPDATE Series SET name = $name, description = $description WHERE id = $id', 
        {
            $name: name,
            $description: description,
            $id: req.params.seriesId
        }, err => {
            if (err){
                next(err);
            } else {
                db.get(`SELECT * FROM Series WHERE id = ${req.params.seriesId}`, 
                (err, row) => {
                    res.status(200).send({series: row});
                });
            }
            
        }
    );
    
});


seriesRouter.delete('/:seriesId', (res, req, next) => {
    const id = req.body.series.id;
    
    db.serialize( () => {

        db.all('SELECT * FROM Issue WHERE series_id = $seriesId', 
        {$seriesId: id},
        (err, rows) => {
            if(err) {
                next(err);
            } 

            if(!rows) {
                return res.status(400).send();
            }
        });

        db.run('DELETE * FROM Series WHERE id = $id',
        {$id: id},
        err => {
            if(err){
                next(err);
            } else {
                res.status(204).send();
            }
        });

    });
});




module.exports = seriesRouter;