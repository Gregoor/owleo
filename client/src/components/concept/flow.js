import React, {Component} from 'react';
import Relay from 'react-relay';
import cola from 'webcola';
import d3 from 'd3';
import _ from 'lodash';

import {Spinner} from '../mdl';

import './flow.scss';

class ConceptFlow extends Component {

  state = {isLoading: true};

  componentDidMount() {
    const self = this;
    self.navState = {x: 0, y: 0};
    const d3cola = cola.d3adaptor().convergenceThreshold(0.1);

    const {svg} = this.refs;
    const width = this.width =  svg.offsetWidth;
    const height = this.height = svg.offsetHeight;

    const outer = d3.select(svg).attr({width, height, 'pointer-events': 'all'});

    const background = outer.append('rect')
      .attr({class: 'background', width: '100%', height: '100%'});

    this.vis = outer.append('g');

    background.call(d3.behavior.drag().on('drag', function() {
      const {dx, dy} = d3.event;
      self.vis.classed('in-transition', false);
      self._setPosition(self.navState.x + dx, self.navState.y + dy);
    }));

    outer.append('svg:defs').append('svg:marker')
      .attr({
        id: 'end-arrow', viewBox: '0 -5 10 10', refX: 8,
        markerWidth: 6, markerHeight: 6, orient: 'auto'
      })
      .append('svg:path').attr({
        d: 'M0,-5L10,0L0,5L2,0', 'stroke-width': '0px', fill: '#000'
      });

    const {concepts} = this.props;

    this.conceptsMap = new Map(concepts.map(c => [c.id, c]));

    const idMap = new Map();

    const nodes = [];
    concepts.forEach(({id, name}, i) => {
      nodes.push({id: i, realID: id, name});
      idMap.set(id, i);
    });

    const edges = [];
    for (const concept of concepts) {
      for (const req of concept.reqs) {
        edges.push({
          sourceID: req.id, targetID: concept.id,
          source: idMap.get(req.id), target: idMap.get(concept.id),
          isContainer: req.id == concept.container.id
        });
      }
    }

    const distance = concepts.reduce((max, {name}) => Math.max(max, name.length), 0) * 5;

    d3cola
      .avoidOverlaps(true)
      .convergenceThreshold(1e-1)
      .flowLayout('y', distance)
      .nodes(nodes)
      .links(edges)
      .jaccardLinkLengths(distance);

    const idsToEls = this.idsToEls = new Map(concepts.map(({id}) => [id, {
      rect: null, label: null, links: []
    }]));

    const link = this.vis.selectAll('.link')
      .data(edges)
      .enter().append('path')
      .attr('class', d => `link ${d.isContainer? 'is-container' : ''}`)
      .each(function({sourceID, targetID}) {
        //idsToEls.get(sourceID).links.push(this);
        idsToEls.get(targetID).links.push(this);
      });

    const node = this.vis.selectAll('.node')
      .data(nodes)
      .enter().append('rect')
      .classed('node', true)
      .attr({rx: 5, ry: 5})
      .on('click', d => self.props.onSelect(d.realID))
      .each(function({realID}) { idsToEls.get(realID).rect = this; });

    const margin = 5, pad = 6;
    const label = this.vis.selectAll('.label')
      .data(nodes)
      .enter().append('text')
      .attr('class', 'label')
      .text(d => d.name)
      .on('click', d => self.props.onSelect(d.realID))
      .each(function(d) {
        idsToEls.get(d.realID).label = this;
        const {width, height} = this.getBBox();
        const extra = 2 * margin + 2 * pad;
        d.width = width + extra;
        d.height = height + extra;
      });

    const lineFunction = d3.svg.line()
      .x(d => d.x).y(d => d.y).interpolate('linear');

    const routeEdges = function() {
      d3cola.prepareEdgeRouting();
      link.attr('d', d => lineFunction(d3cola.routeEdge(d)));
    };

    d3cola.start(50, 100, 200).on('end', function() {
      node.each(function(d) { d.innerBounds = d.bounds.inflate(-margin); })
        .attr({
          'x': d => d.innerBounds.x, 'y': d => d.innerBounds.y,
          'width': d => d.innerBounds.width(), 'height': d => d.innerBounds.height()
        });

      link.attr('d', function(d) {
        const route = cola.vpsc.makeEdgeBetween(d.source.innerBounds, d.target.innerBounds, 5);
        return lineFunction([route.sourceIntersection, route.arrowStart]);
      });

      label.attr({'x': d => d.x, 'y': d => d.y + (margin + pad) / 2});

      routeEdges();

      self.hasRendered = true;
      self._focus(self.props.selectedConcept);
      self._redraw();
      self.setState({isLoading: false});
    });
  }

  componentWillReceiveProps({concepts, selectedConcept}) {
    this.conceptsMap = new Map(concepts.map(c => [c.id, c]));
    if (this.hasRendered) {
      this._focus(selectedConcept);
      this._redraw();
    }
  }

  render() {
    const {isLoading}  = this.state;
    return (
      <div>
        {isLoading ? <Spinner/> : ''}
        <svg ref="svg" className="flow"
             style={{visibility: isLoading ? 'hidden' : 'visible'}}/>
      </div>
    );
  }

  _focus({id}) {
    const {rect, links} = this.idsToEls.get(id);
    let {x, y, width, height} = rect.getBBox();
    this.vis.classed('in-transition', true);
    this._setPosition(
      this.width / 2 - x - width / 2,
      this.height / 2 - y - height / 2
    );
    d3.select(this.refs.svg).selectAll('.selected').classed('selected', false);
    rect.classList.add('selected');
    d3.selectAll(links).classed('selected', true);
  }

  _setPosition(x, y) {
    this.navState = {x, y};
    this.vis.style('transform', `translate(${x}px, ${y}px)`);
  }

  _redraw() {
    for (const [id, {rect, label, links}] of this.idsToEls.entries()) {
      d3.selectAll([rect, label, ...links])
        .style('opacity', this.conceptsMap.get(id).mastered ? .5 : 1)
    }
  }

}

export default Relay.createContainer(ConceptFlow, {

  fragments: {
    concepts: (vars) => Relay.QL`
      fragment on Concept @relay(plural: true) {
        id
        name
        mastered
        reqs { id }
        container { id }
      }
    `
  }

});
