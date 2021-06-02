const EventEmitter = require('events');
const { move } = require('./move');
module.exports = class Mover extends EventEmitter {
    _trace = (traceInfo) => {
        this.emit('progress',traceInfo);
    }

    move = ({ target, directory, storageClass, partSizeMb, removeIfEmpty }) => {
        return move({target, directory, storageClass, partSizeMb, removeIfEmpty, trace: this._trace})
    }
}