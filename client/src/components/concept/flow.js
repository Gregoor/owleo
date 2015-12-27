import React, {Component} from 'react';
import Relay from 'react-relay';
import cola from 'webcola';
import d3 from 'd3';

import './flow.scss';

class ConceptFlow extends Component {

  state = {};

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

    const idMap = new Map();
    const nodes = [];
    concepts.forEach(({id, name}, i) => {
      nodes.push({id: i, realID: id, name});
      idMap.set(id, i);
    });

    const edges = [];
    for (const concept of concepts) {
      for (const req of concept.reqs) {
        edges.push({source: idMap.get(req.id), target: idMap.get(concept.id)});
      }
    }

    d3cola
      .avoidOverlaps(true)
      .convergenceThreshold(1e-1)
      .flowLayout('y', 150)
      .nodes(nodes)
      .links(edges)
      .jaccardLinkLengths(150);

    const link = this.vis.selectAll('.link')
      .data(edges)
      .enter().append('path')
      .attr('class', 'link');


    const idsToNodes = this.idsToNodes = new Map();
    const node = this.vis.selectAll('.node')
      .data(nodes)
      .enter().append('rect')
      .classed('node', true)
      .attr({rx: 5, ry: 5})
      .on('click', d => (self.selfChanged = true) && self.props.onSelect(d.realID))
      .each(function({realID}) { idsToNodes.set(realID, this); });

    const margin = 10, pad = 12;
    const label = this.vis.selectAll('.label')
      .data(nodes)
      .enter().append('text')
      .attr('class', 'label')
      .text(d => d.name)
      .on('click', d => (self.selfChanged = true) && self.props.onSelect(d.realID))
      .each(function(d) {
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
    });
  }

  componentWillReceiveProps(props) {
    if (this.hasRendered) this._focus(props.selectedConcept);
  }

  render() {
    return <svg ref="svg" className="flow"/>;
  }

  _focus({id}) {
    const node = this.idsToNodes.get(id);
    let {x, y} = node.getBBox();
    if (this.selfChanged) {
      this.selfChanged = false;
    } else {
      this._setPosition(this.width / 2 - x, this.height / 2 - y);
    }
    d3.select(this.refs.svg).select('.selected').classed('selected', false);
    node.classList.add('selected');
  }

  _setPosition(x, y) {
    this.navState = {x, y};
    this.vis.style('transform', `translate(${x}px, ${y}px)`);
  }

}

export default Relay.createContainer(ConceptFlow, {

  fragments: {
    concepts: (vars) => Relay.QL`
      fragment on Concept @relay(plural: true) {
        id
        name
        reqs { id }
      }
    `
  }

});
