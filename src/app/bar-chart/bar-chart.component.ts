import { OnInit, Component, ElementRef, Input, OnChanges, ViewChild, ViewEncapsulation, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { DataModel } from 'src/app/data/data.nodeLink';

@Component({
  selector: 'app-bar-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss']
})
export class BarChartComponent implements OnChanges {
  // export class BarChartComponent implements OnInit {




  @ViewChild('chart', { static: false })
  private chartContainer: ElementRef;

  // @Input()
  // data: DataModel[];


  @Input()
  data: DataModel;
  margin = { top: 20, right: 20, bottom: 30, left: 40 };

  constructor() { }
  // ngOnInit() {
  //   this.createChart();
  // }
  ngOnChanges(): void {
    if (!this.data) { return; }

    this.createChart();
  }

  onResize() {
    this.createChart();
  }

  private createChart(): void {


    d3.select('svg').remove();

    const element = this.chartContainer.nativeElement;
    //   const data = this.data;

    const svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight * 3);
    // .attr('width', 500)
    // .attr('height', 500);
    // var svg = d3.select("svg"),
    var width = +element.offsetWidth;
    var height = +element.offsetHeight
    //   const contentWidth = element.offsetWidth - this.margin.left - this.margin.right;
    //   const contentHeight = element.offsetHeight - this.margin.top - this.margin.bottom;

    var color = d3.scaleOrdinal(d3.schemeAccent);

    var simulation = d3.forceSimulation()
      .force("link", d3.forceLink())
      // .force("charge", d3.forceManyBody())
      .force("collide", d3.forceCollide(20))

      .force("center", d3.forceCenter(width / 2, height / 2));
    // .force("locationX", d3.forceX().x(2000))
    // .force("locationY", d3.forceY().y(2000));

    // d3.json("miserable.json", function (error, graph) {
    // if (error) throw error;

    var graph = this.data;
    var dataNode = graph['nodes'];;
    var dataLink = graph['links'];
    // console.log(graph);
    // console.log(dataLink);
    // console.log(dataNode);

    var link = svg.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(dataLink)
      .enter().append("path")
      .attr("stroke", "black")
      // .attr("style", "stroke: #ff0000; stroke-opacity: 0.6;")
      // .attr("transform", "translate(0,0)")
      // .attr("stroke", (d)=> { return "#D3D3D3"; })
      .attr("stroke-width", 10)
      .attr('stroke', 'black');// add this line
    // function (d) { /*console.log(d['value']);*/return Math.sqrt(d['value']); });

    var node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(dataNode)
      .enter().append("g");

    var circles = node.append("circle")
      .attr("r", 5)
      .attr("fill", function (d) { return color(d['group']); })
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    var lables = node.append("text")
      .text(function (d) {
        return d['id'];
      })
      .attr('x', 6)
      .attr('y', 3);

    node.append("title")
      .text(function (d) { return d['id']; });

    simulation
      .nodes(dataNode)
      // .on("tick", () => ticked(dataNode, dataLink));
      .on("tick", ticked);

    // simulation.force("link").links(dataLink);
    simulation.force("links", d3.forceLink().links(dataLink)
      .id(function (d) { /*console.log(d['id']);*/return d['id']; }))
      ;
    // .force("link").links(dataLink);
    // .force("link", d3.forceLink(dataLink));
    // simulation.force("link").links(graph.links);

    function ticked() {
      link
        .attr("x1", function (d) { return d['source.x']; })
        .attr("y1", function (d) { return d['source.y']; })
        .attr("x2", function (d) { return d['target.x']; })
        .attr("y2", function (d) { return d['target.y']; })
        // .attr("stroke","black")
        // .attr("stroke-width", function (d) { /*console.log(d['value']);*/return Math.sqrt(d['value']); });
        ;

      node
        .attr("transform", function (d) {
          return "translate(" + d['x'] + "," + d['y'] + ")";
        })
    }
    // });

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    // simulation.alpha(1).restart();
    //till here



    //   const x = d3
    //     .scaleBand()
    //     .rangeRound([0, contentWidth])
    //     .padding(0.1)
    //     .domain(data.map(d => d.letter));

    //   const y = d3
    //     .scaleLinear()
    //     .rangeRound([contentHeight, 0])
    //     .domain([0, d3.max(data, d => d.frequency)]);

    //   const g = svg.append('g')
    //     .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    //   g.append('g')
    //     .attr('class', 'axis axis--x')
    //     .attr('transform', 'translate(0,' + contentHeight + ')')
    //     .call(d3.axisBottom(x));

    //   g.append('g')
    //     .attr('class', 'axis axis--y')
    //     .call(d3.axisLeft(y).ticks(10, '%'))
    //     .append('text')
    //       .attr('transform', 'rotate(-90)')
    //       .attr('y', 6)
    //       .attr('dy', '0.71em')
    //       .attr('text-anchor', 'end')
    //       .text('Frequency');

    //   g.selectAll('.bar')
    //     .data(data)
    //     .enter().append('rect')
    //       .attr('class', 'bar')
    //       .attr('x', d => x(d.letter))
    //       .attr('y', d => y(d.frequency))
    //       .attr('width', x.bandwidth())
    //       .attr('height', d => contentHeight - y(d.frequency));
  }
}
