import assert from 'assert';

import Concept from '../db/concept';

describe('Concept', function() {

  describe('#find', () => {

    it('retrieves single', () => {
      return Concept.find({limit: 1}).then(concepts => {
        assert.equal(concepts.length, 1);
        assert(concepts[0].id);
      });
    });

    it('retrieves multiple', () => {
      return Concept.find({limit: 10}).then(concepts => {
        assert.equal(concepts.length, 10);
      });
    });

    it('retrieves name and summary', () => {
      return Concept.find({limit: 5}, {name: true, summary: true})
        .then(concepts => concepts.map(concept => {
          assert(concept.name);
        }));
    });

    it('retrieves with container summary but without container name', () => {
      return Concept.find({limit: 1}, {container: {summary: true}})
        .then(([concept]) => {
          assert(concept.container.summary);
          assert(!concept.container.name);
        });
    });

    // TODO: This test is as unstable as my stepdad
    it('retrieves container container\'s name', () => {
      return Concept.find(
        {id: 'ccb9ada7-d2dd-4b7e-b1c3-d85dc6625136'},
        {container: {container: {name: true}}}
      ).then(([concept]) => {
        assert(concept.container.container.name);
      });
    });

    // TODO: Just as bad
    it('retrieves reqs with names', () => {
      return Concept.find(
        {id: '3c5f0e90-11a9-4ec5-97b9-5e92681264e5'},
        {reqs: {name: true}}
      ).then(([concept]) => {
        assert(concept.reqs);
        return concept.reqs.map(req => assert(req.name));
      });
    });

    it('retrieves containees with names', () => {
      return Concept.find(
        {limit: 1},
        {concepts: {name: true}}
      ).then(([concept]) => {
        assert(concept.concepts);
        return concept.concepts.map(req => assert(req.name));
      });
    });

  });

});
