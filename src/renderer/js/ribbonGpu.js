// GPU strokes for the three neon ribbons. Audio, layout and motion stay in Visualizer.
// Unsupported/lost GPU contexts fall back to the existing Canvas 2D renderer.
(() => {
  const palettes={aurora:['#38bdf8','#a78bfa','#f472b6'],ocean:['#22d3ee','#3b82f6','#6366f1'],sunset:['#fbbf24','#fb7185','#c084fc'],forest:['#a3e635','#34d399','#2dd4bf']};
  const original=[['#4777ac','#8060c1','#684184'],['#c8e5f1','#dae6ff','#b6c6e5'],['#40a9de','#ab85fb','#c45395']];
  const rgb=hex=>[1,3,5].map(at=>parseInt(hex.slice(at,at+2),16)/255);
  class RibbonGPU {
    constructor(){
      this.canvas=document.createElement('canvas');
      const gl=this.gl=this.canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});
      if(!gl)throw Error('GPU ribbon unavailable');
      this.lost=false;
      this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;});
      const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
      const vertex=shader(gl.VERTEX_SHADER,`attribute vec2 a_position;attribute vec2 a_miter;attribute float a_side;uniform vec2 u_size;uniform float u_extent;varying float v_side;varying float v_x;
        void main(){vec2 position=a_position+a_miter*u_extent;gl_Position=vec4(position/u_size*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);v_side=a_side*u_extent;v_x=position.x/u_size.x;}`);
      const fragment=shader(gl.FRAGMENT_SHADER,`precision mediump float;varying float v_side;varying float v_x;uniform float u_half;uniform float u_alpha;uniform float u_aa;uniform vec3 u_c0;uniform vec3 u_c1;uniform vec3 u_c2;
        void main(){float a=clamp((u_half+u_aa-abs(v_side))/(2.*u_aa),0.,1.)*u_alpha;float x=clamp(v_x,0.,1.);vec3 color=x<.5?mix(u_c0,u_c1,x*2.):mix(u_c1,u_c2,x*2.-1.);gl_FragColor=vec4(color*a,a);}`);
      const program=this.program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('GPU ribbon link failed');
      gl.deleteShader(vertex);gl.deleteShader(fragment);gl.useProgram(program);
      this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
      for(const [name,size,offset] of [['a_position',2,0],['a_miter',2,8],['a_side',1,16]]){
        const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,20,offset);
      }
      this.uniforms=Object.fromEntries(['u_size','u_extent','u_half','u_alpha','u_aa','u_c0','u_c1','u_c2'].map(n=>[n,gl.getUniformLocation(program,n)]));
      gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
      this.vertices=new Float32Array(4096*10);
      this.curve=new Float64Array(4096*2);
    }
    // Subdivide the exact quadratic path; endpoints and musical deformation are unchanged.
    flatten(points){
      const curve=this.curve;let n=0,px=points[0],py=points[1];curve[n++]=px;curve[n++]=py;
      for(let i=2;i<points.length;i+=2){
        const cx=points[i-2],cy=points[i-1],ex=(cx+points[i])*.5,ey=(cy+points[i+1])*.5;
        for(let step=1;step<=4;step++){
          const t=step/4,a=1-t;curve[n++]=a*a*px+2*a*t*cx+t*t*ex;curve[n++]=a*a*py+2*a*t*cy+t*t*ey;
        }
        px=ex;py=ey;
      }
      curve[n++]=points.at(-2);curve[n++]=points.at(-1);return n/2;
    }
    prepareStroke(count){
      const gl=this.gl,p=this.curve,v=this.vertices;
      for(let i=0;i<count;i++){
        const prev=Math.max(0,i-1),next=Math.min(count-1,i+1);
        let ax=p[i*2]-p[prev*2],ay=p[i*2+1]-p[prev*2+1],bx=p[next*2]-p[i*2],by=p[next*2+1]-p[i*2+1];
        if(i===0){ax=bx;ay=by;}if(i===count-1){bx=ax;by=ay;}
        const al=Math.hypot(ax,ay)||1,bl=Math.hypot(bx,by)||1;
        let nx=-ay/al-by/bl,ny=ax/al+bx/bl;const nl=Math.hypot(nx,ny)||1;nx/=nl;ny/=nl;
        const miter=1/Math.max(.25,nx*(-by/bl)+ny*(bx/bl));
        for(let side=0;side<2;side++){const sign=side?1:-1,at=i*10+side*5;v[at]=p[i*2];v[at+1]=p[i*2+1];v[at+2]=nx*miter*sign;v[at+3]=ny*miter*sign;v[at+4]=sign;}
      }
      // Upload the shape once. Glow widths expand the same mesh in the vertex shader.
      gl.bufferData(gl.ARRAY_BUFFER,v.subarray(0,count*10),gl.STREAM_DRAW);
    }
    stroke(count,width,alpha,colors,w,h,dpr){
      const gl=this.gl,u=this.uniforms,half=width*.5,aa=.65/dpr;
      gl.uniform1f(u.u_extent,half+aa);
      gl.uniform1f(u.u_half,half);gl.uniform1f(u.u_alpha,Math.min(1,Math.max(0,alpha)));gl.uniform1f(u.u_aa,aa);
      for(let i=0;i<3;i++)gl.uniform3fv(u['u_c'+i],colors[i]);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,count*2);
    }
    draw(ctx,rows,layers,lineWidth,glow,color,w,h){
      if(this.lost||this.gl.isContextLost())return false;
      const gl=this.gl,c=this.canvas,pixelW=ctx.canvas.width,pixelH=ctx.canvas.height;
      if(c.width!==pixelW||c.height!==pixelH){c.width=pixelW;c.height=pixelH;gl.viewport(0,0,pixelW,pixelH);}
      gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform2f(this.uniforms.u_size,w,h);
      const palette=color?.palette||'original',key=palette+':'+(color?.solidColor||'');
      if(this.colorKey!==key){
        this.colorKey=key;
        this.colors=original.map(colors=>(palette==='original'?colors:palette==='solid'?Array(3).fill(color.solidColor||'#38bdf8'):palettes[palette]||palettes.aurora).map(rgb));
      }
      for(let row=0;row<3;row++){
        const count=this.flatten(rows[row]),width=Math.max(1,lineWidth*layers[row].width),alpha=layers[row].alpha,colors=this.colors[row];
        this.prepareStroke(count);
        if(glow>0){this.stroke(count,width*4,alpha*.05*glow,colors,w,h,pixelW/w);this.stroke(count,width*2,alpha*.10*glow,colors,w,h,pixelW/w);}
        this.stroke(count,width,alpha,colors,w,h,pixelW/w);
        if(glow>0&&row===1)this.stroke(count,Math.max(.65,width*.45),glow*.45,palette==='original'?Array(3).fill(rgb('#effcff')):colors,w,h,pixelW/w);
      }
      ctx.drawImage(c,0,0,w,h);return true;
    }
  }
  window.GlassWaveRibbonGPU=RibbonGPU;
})();
