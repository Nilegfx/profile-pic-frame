FROM registry.opensource.zalan.do/teapot/skipper:latest

COPY index.html /var/skipper/static/index.html
COPY konva.min.js /var/skipper/static/konva.min.js
COPY frame-1.png /var/skipper/static/frame-1.png
COPY frame-2.png /var/skipper/static/frame-2.png
COPY frame-3.png /var/skipper/static/frame-3.png
COPY frame-4.png /var/skipper/static/frame-4.png
COPY frame-5.png /var/skipper/static/frame-5.png
COPY frame-6.png /var/skipper/static/frame-6.png

EXPOSE 9090

CMD ["skipper", "-inline-routes", "* -> static(\"/\", \"/var/skipper/static\") -> <shunt>", "-address", ":9090"]
