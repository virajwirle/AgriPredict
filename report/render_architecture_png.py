from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

W,H=1700,1180
im=Image.new('RGB',(W,H),'white'); d=ImageDraw.Draw(im)
fontdir=Path('C:/Windows/Fonts')
def font(size,bold=False):
    path=fontdir/('arialbd.ttf' if bold else 'arial.ttf')
    return ImageFont.truetype(str(path),size)
title=font(34,True); sub=font(18); head=font(19,True); body=font(16); small=font(14)
green='#e7f2e9'; outline='#34704d'; pale='#f5faf6'; blue='#edf3fb'; blueedge='#5278a0'; gold='#fff5df'; goldedge='#b4832f'; ink='#173c30'; text='#213b32'; muted='#52665d'; line='#46665b'; panel='#fbfcfb'
def box(x,y,w,h,fill=pale,edge='#46745e',radius=18,width=3):
    d.rounded_rectangle((x,y,x+w,y+h),radius=radius,fill=fill,outline=edge,width=width)
def centered(x,y,w,txt,f,fill=text):
    b=d.textbbox((0,0),txt,font=f); d.text((x+(w-(b[2]-b[0]))/2,y),txt,font=f,fill=fill)
def arrow(points,color=line,width=4):
    d.line(points,fill=color,width=width,joint='curve')
    x1,y1=points[-2]; x2,y2=points[-1]
    if abs(x2-x1)>=abs(y2-y1):
        if x2>=x1: pts=[(x2,y2),(x2-14,y2-8),(x2-14,y2+8)]
        else: pts=[(x2,y2),(x2+14,y2-8),(x2+14,y2+8)]
    else:
        if y2>=y1: pts=[(x2,y2),(x2-8,y2-14),(x2+8,y2-14)]
        else: pts=[(x2,y2),(x2-8,y2+14),(x2+8,y2+14)]
    d.polygon(pts,fill=color)
def panel_box(y,h,label):
    d.rounded_rectangle((48,y,1652,y+h),radius=20,fill=panel,outline='#b9c9bf',width=2); d.text((75,y+22),label,font=head,fill=ink)
d.text((70,25),'AgriPredict Shared Crop-Specific Model Architecture',font=title,fill='#18352b')
d.text((70,70),'Common ResNet50–Transformer pipeline; each crop has its own trained weights and crop-specific output classes',font=sub,fill=muted)
panel_box(125,500,'A. Image inference path')
items=[(75,220,180,172,blue,blueedge,['Leaf image','RGB input','224 × 224 × 3','One selected crop']),
(290,220,205,172,pale,'#46745e',['Preprocessing','Resize / crop','ImageNet normalize','Augmentation in training only']),
(530,205,245,202,green,outline,['ResNet50 backbone','ImageNet pretrained','Convolutional layers','through layer4','Average pool and FC removed']),
(810,220,190,172,pale,'#46745e',['Feature map','B × 2048 × 7 × 7','Spatial CNN features']),
(1035,205,255,202,green,outline,['1 × 1 projection','2048 channels → 512','Flatten 7 × 7 positions','49 tokens × 512','Add learned positional embeddings']),
(1325,205,285,202,green,outline,['Transformer encoder','2 encoder layers','8-head self-attention','Feed-forward: 2048','GELU · dropout 0.2 · LayerNorm'])]
for x,y,w,h,fill,edge,lines in items:
    box(x,y,w,h,fill,edge)
    centered(x,y+28,w,lines[0],head,ink)
    for j,t in enumerate(lines[1:]): centered(x,y+65+j*29,w,t,body if j<len(lines)-2 else small,text if j<len(lines)-2 else muted)
for a,b in [((255,306),(282,306)),((495,306),(522,306)),((775,306),(802,306)),((1000,306),(1027,306)),((1290,306),(1317,306))]: arrow([a,b])
# lower inference stage
blocks=[(75,452,420,116,gold,goldedge,['Optional reliability / OOD decision','Applied after classification if configured','Accept result or return uncertain / reject']),
(530,452,245,116,pale,'#46745e',['Mean token pooling','49 × 512 → 512 vector','No CLS token in this model']),
(810,452,230,116,pale,'#46745e',['Classification head','LayerNorm → dropout','Linear: 512 → Kcrop']),
(1075,452,260,116,pale,'#46745e',['Class probabilities','Softmax(logits)','Top class and score']),
(1370,452,240,116,blue,blueedge,['Crop-specific output','Kcrop disease classes','Separate weights per crop'])]
for x,y,w,h,fill,edge,lines in blocks:
    box(x,y,w,h,fill,edge,16,2)
    centered(x,y+20,w,lines[0],head,ink)
    centered(x,y+55,w,lines[1],body)
    centered(x,y+83,w,lines[2],small,muted)
arrow([(1467,407),(1467,430),(652,430),(652,444)])
arrow([(775,510),(802,510)]); arrow([(1040,510),(1067,510)]); arrow([(1335,510),(1362,510)])
# dashed optional feedback path
d.line([(1370,532),(1348,532),(1348,594),(285,594),(285,576)],fill='#7d9187',width=3)
for x in range(286,1349,18): d.ellipse((x,592,x+5,597),fill='#7d9187')
arrow([(285,594),(285,576)],color='#7d9187',width=3)
centered(430,600,900,'Weather and fertilizer are separate advisory components, not inputs to the leaf-image classifier.',small,muted)
# training panel
panel_box(650,270,'B. Shared training and model selection procedure')
train=[(78,725,255,145,blue,blueedge,['Crop-specific dataset','Train / validation / test','Keep test data held out']),
(380,725,315,145,green,outline,['Stage 1: train head','Freeze ResNet50 backbone','Train projection, Transformer, classifier']),
(742,725,315,145,green,outline,['Stage 2: fine-tune','Unfreeze ResNet50 layer4','Differential learning rates']),
(1104,725,230,145,pale,'#46745e',['Select checkpoint','Validation macro-F1','Early stopping / scheduler']),
(1380,725,230,145,gold,goldedge,['Evaluate','Internal and external test','OOD separately where available'])]
for x,y,w,h,fill,edge,lines in train:
    box(x,y,w,h,fill,edge,16,2)
    centered(x,y+24,w,lines[0],head,ink); centered(x,y+62,w,lines[1],body); centered(x,y+98,w,lines[2],small,muted)
for a,b in [((333,797),(372,797)),((695,797),(734,797)),((1057,797),(1096,797)),((1334,797),(1372,797))]: arrow([a,b])
# crop specific panel
panel_box(945,190,'C. Ten independently trained crop-specific models')
d.text((75,1008),'Shared architecture and workflow; weights, class labels, and output dimension Kcrop are specific to each crop.',font=body,fill=text)
crops=['Apple','Maize','Grapes','Tea','Potato','Cotton','Sugarcane','Groundnut','Okra','Pumpkin']
for idx,c in enumerate(crops):
    x=76+idx*157
    d.rounded_rectangle((x,1043,x+145,1091),radius=14,fill='#dcebe0',outline='#8eaf98',width=2)
    centered(x,1058,145,c,body,text)
im.save('report/AgriPredict_Ten_Crop_Architecture.png',optimize=True)
print('report/AgriPredict_Ten_Crop_Architecture.png')
