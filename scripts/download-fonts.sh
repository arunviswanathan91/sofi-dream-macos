#!/bin/bash
# Script to download Google Fonts for Sofi Dream app

FONTS_DIR="assets/fonts"
mkdir -p "$FONTS_DIR"

echo "Downloading Playfair Display..."
curl -sL "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgEM86xRbPQ.ttf" \
  -o "$FONTS_DIR/PlayfairDisplay-Regular.ttf"
curl -sL "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFlD-vYSZviVYUb_rj3ij__anPXDTzYhEMpFWNL4g.ttf" \
  -o "$FONTS_DIR/PlayfairDisplay-Bold.ttf"

echo "Downloading DM Sans..."
curl -sL "https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZa4ET-DNl0.ttf" \
  -o "$FONTS_DIR/DMSans-Regular.ttf"
curl -sL "https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZa4HA7-DNl0.ttf" \
  -o "$FONTS_DIR/DMSans-Medium.ttf"
curl -sL "https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZa4Gxq-DNl0.ttf" \
  -o "$FONTS_DIR/DMSans-Bold.ttf"

echo "Downloading DM Mono..."
curl -sL "https://fonts.gstatic.com/s/dmmono/v14/aFTU7vBl4hIpivnYeRn6PqNAYA.ttf" \
  -o "$FONTS_DIR/DMMono-Regular.ttf"

echo "Fonts downloaded to $FONTS_DIR"
ls -la "$FONTS_DIR"
