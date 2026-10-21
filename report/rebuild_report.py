from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).parent
OUT = ROOT / 'AgriPredict_BE_Project_Report.docx'
FIGS = ROOT / 'AgriPredict_Overleaf' / 'figures'

def set_cell_shading(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd'); shd.set(qn('w:fill'), fill); tcPr.append(shd)

def set_repeat_table_header(row):
    trPr = row._tr.get_or_add_trPr(); el=OxmlElement('w:tblHeader'); el.set(qn('w:val'),'true'); trPr.append(el)

def set_cell_margins(cell, top=70, start=80, bottom=70, end=80):
    tc=cell._tc; tcPr=tc.get_or_add_tcPr(); mar=OxmlElement('w:tcMar')
    for m,v in [('top',top),('start',start),('bottom',bottom),('end',end)]:
        node=OxmlElement('w:'+m); node.set(qn('w:w'),str(v)); node.set(qn('w:type'),'dxa'); mar.append(node)
    tcPr.append(mar)

def set_cell_text(cell, text, bold=False, color=None, size=8.5):
    cell.text=''
    p=cell.paragraphs[0]; p.paragraph_format.space_after=Pt(0); p.paragraph_format.space_before=Pt(0)
    r=p.add_run(str(text)); r.bold=bold; r.font.name='Times New Roman'; r.font.size=Pt(size)
    if color: r.font.color.rgb=RGBColor(*color)
    cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER; set_cell_margins(cell)

def add_table(doc, headers, rows, widths=None, size=8.2):
    t=doc.add_table(rows=1, cols=len(headers)); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.style='Table Grid'
    t.autofit=False
    for j,h in enumerate(headers):
        set_cell_text(t.rows[0].cells[j],h,True,(255,255,255),size); set_cell_shading(t.rows[0].cells[j],'285943')
    set_repeat_table_header(t.rows[0])
    for i,row in enumerate(rows):
        cells=t.add_row().cells
        for j,val in enumerate(row):
            set_cell_text(cells[j],val,size=size)
            if i%2: set_cell_shading(cells[j],'EEF3EF')
    if widths:
        for row in t.rows:
            for j,w in enumerate(widths): row.cells[j].width=Inches(w)
    doc.add_paragraph().paragraph_format.space_after=Pt(0)
    return t

def add_caption(doc, text, label='Figure'):
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before=Pt(2); p.paragraph_format.space_after=Pt(8)
    r=p.add_run(text); r.font.name='Times New Roman'; r.font.size=Pt(9); r.italic=True

def add_table_title(doc, text):
    p=doc.add_paragraph(); p.paragraph_format.keep_with_next=True; p.paragraph_format.space_before=Pt(8); p.paragraph_format.space_after=Pt(4)
    r=p.add_run(text); r.bold=True; r.font.name='Times New Roman'; r.font.size=Pt(9)

def add_pic(doc,path,width=6.1):
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(str(path),width=Inches(width))

def add_page_field(paragraph):
    paragraph.alignment=WD_ALIGN_PARAGRAPH.CENTER
    r=paragraph.add_run(); begin=OxmlElement('w:fldChar'); begin.set(qn('w:fldCharType'),'begin')
    instr=OxmlElement('w:instrText'); instr.set(qn('xml:space'),'preserve'); instr.text=' PAGE '
    sep=OxmlElement('w:fldChar'); sep.set(qn('w:fldCharType'),'separate'); txt=OxmlElement('w:t'); txt.text='1'
    end=OxmlElement('w:fldChar'); end.set(qn('w:fldCharType'),'end')
    for x in (begin,instr,sep,txt,end): r._r.append(x)

def make_flow_diagram(path, model=False):
    w,h=(1800,780) if not model else (1800,1060)
    im=Image.new('RGB',(w,h),'white'); d=ImageDraw.Draw(im)
    try:
        font=ImageFont.truetype('arial.ttf',26); small=ImageFont.truetype('arial.ttf',20); bold=ImageFont.truetype('arialbd.ttf',25)
    except Exception:
        font=small=bold=ImageFont.load_default()
    green='#285943'; gray='#EAF0EC'; line='#355E48'; blue='#EAF0F7'
    def box(x,y,bw,bh,title,sub='',fill=gray):
        d.rounded_rectangle((x,y,x+bw,y+bh),radius=18,fill=fill,outline=line,width=3)
        bb=d.textbbox((0,0),title,font=bold); d.text((x+(bw-(bb[2]-bb[0]))/2,y+18),title,font=bold,fill='#173D2A')
        if sub:
            lines=sub.split('\n'); yy=y+60
            for s in lines:
                bb=d.textbbox((0,0),s,font=small); d.text((x+(bw-(bb[2]-bb[0]))/2,yy),s,font=small,fill='#22332A'); yy+=28
    def arrow(x1,y1,x2,y2):
        d.line((x1,y1,x2,y2),fill=line,width=4)
        import math
        a=math.atan2(y2-y1,x2-x1); L=18
        p1=(x2-L*math.cos(a-.48),y2-L*math.sin(a-.48)); p2=(x2-L*math.cos(a+.48),y2-L*math.sin(a+.48))
        d.polygon([(x2,y2),p1,p2],fill=line)
    if not model:
        xs=[45,340,635,930,1225,1520]; titles=['Farmer / user','Crop and image','Input checks','Crop model','Reliability decision','Result and guidance']
        subs=['web interface','crop selection\nimage upload','file and image\nquality validation','crop-specific\nclassifier','accept or mark\nuncertain','disease information\nweather context']
        for x,t,s in zip(xs,titles,subs): box(x,180,235,145,t,s)
        for a,b in zip(xs[:-1],xs[1:]): arrow(a+235,253,b-10,253)
        box(510,490,470,150,'AgriPredict AI Assistant','separate authenticated chat path\nretrieval from farmer Q&A corpus + response',blue)
        arrow(160,325,510,565)
        d.text((45,45),'AgriPredict application workflow',font=bold,fill=green)
    else:
        box(580,35,640,100,'Input image','crop-specific resize, normalization, and views',blue)
        box(50,195,520,170,'ResNet50 feature backbone','ImageNet-initialized stem and residual stages',gray)
        box(640,195,520,170,'Crop-specific feature processing','spatial feature map or multiple ResNet stages',gray)
        box(1230,195,520,170,'Crop-specific classifier','Transformer, attention, or fused view head',gray)
        arrow(900,135,310,185); arrow(570,280,630,280); arrow(1160,280,1220,280)
        box(120,475,460,150,'Apple and Maize','project features to 512-D tokens\nTransformer encoder and pooling',blue)
        box(665,475,460,150,'Grape, Tea, Potato, Cotton,\nSugarcane, and Okra','multi-scale feature fusion\nspatial/gated attention and tiles',blue)
        box(1210,475,460,150,'Groundnut','stage-2/3/4 scale attention +\nlayer-4 spatial attention; 3 views',blue)
        arrow(1480,365,370,465); arrow(1480,365,895,465); arrow(1480,365,1440,465)
        box(600,755,600,150,'Softmax class scores','crop-specific supported class set',gray); arrow(900,630,900,745)
        d.text((45,45),'Crop model architecture implemented in the notebooks',font=bold,fill=green)
    im.save(path)

make_flow_diagram(ROOT/'AgriPredict_System_Architecture.png')
make_flow_diagram(ROOT/'AgriPredict_Model_Architecture.png',True)

doc=Document(); sec=doc.sections[0]
sec.top_margin=Inches(.75); sec.bottom_margin=Inches(.75); sec.left_margin=Inches(.9); sec.right_margin=Inches(.9)
styles=doc.styles
styles['Normal'].font.name='Times New Roman'; styles['Normal'].font.size=Pt(10.5)
styles['Normal']._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman')
styles['Normal'].paragraph_format.space_after=Pt(5); styles['Normal'].paragraph_format.line_spacing=1.08
for nm,size in [('Title',24),('Heading 1',16),('Heading 2',12),('Heading 3',10.5)]:
    st=styles[nm]; st.font.name='Times New Roman'; st.font.size=Pt(size); st.font.bold=True; st.font.color.rgb=RGBColor(40,89,67)
    st._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman')
    st.paragraph_format.keep_with_next=True
header=sec.header.paragraphs[0]; header.text='AGRIPREDICT  |  PROJECT REPORT'; header.alignment=WD_ALIGN_PARAGRAPH.RIGHT
header.runs[0].font.size=Pt(8); header.runs[0].font.color.rgb=RGBColor(90,100,94)
add_page_field(sec.footer.paragraphs[0])

# Cover page
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(70)
r=p.add_run('UNIVERSITY OF MUMBAI'); r.bold=True; r.font.size=Pt(14); r.font.name='Times New Roman'
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(40)
r=p.add_run('AGRIPREDICT'); r.bold=True; r.font.size=Pt(26); r.font.name='Times New Roman'; r.font.color.rgb=RGBColor(40,89,67)
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=p.add_run('Multi-Crop Disease Classification and Agricultural Assistance System'); r.font.size=Pt(15); r.font.name='Times New Roman'
for text in ['Project Report','Submitted in partial fulfillment of the requirements for the degree of','Bachelor of Technology in Electronics and Telecommunication Engineering']:
    p=doc.add_paragraph(text); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(18); p.add_run('Submitted by').bold=True
for _ in range(4):
    p=doc.add_paragraph('____________________________________________'); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
p=doc.add_paragraph('Under the Guidance of'); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
p=doc.add_paragraph('____________________________________________'); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
p=doc.add_paragraph('Department of Electronics and Telecommunication Engineering\nVidyalankar Institute of Technology, Mumbai\nAcademic Year 2026-27'); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
doc.add_page_break()

doc.add_heading('Abstract',0)
doc.add_paragraph('AgriPredict is a web-based agricultural support system that combines crop-specific leaf-image classifiers with image checks, reliability-aware output, disease information, weather context, and a conversational agriculture assistant. The project evaluates nine crop models: apple, maize, grapes, tea, potato, cotton, sugarcane, groundnut, and okra. The current application crop selector exposes eight crops; Groundnut is reported as a notebook-trained model and is included here in the experimental dataset and results tables, not presented as an enabled application crop. Each model uses its own supported classes and architecture. The notebooks combine ResNet50 features with Transformer, multi-scale attention, spatial attention, or tile aggregation, depending on the crop. On the recorded internal test partitions, the reported accuracy ranges from 88.86% for potato to 97.74% for maize. Selected crop models also apply confidence and k-nearest-neighbour criteria to mark unfamiliar inputs uncertain; these operating-point results are shown separately from classification metrics. The report follows the chapter organization of the University of Mumbai B.E. project-report guide and uses IEEE numbered citations and reference formatting.')
doc.add_paragraph('Keywords: crop disease classification, ResNet50, Transformer, multi-scale attention, image deduplication, out-of-distribution detection, farmer assistant.')
doc.add_heading('Table of Contents',0)
for line in ['Chapter 1  Introduction','Chapter 2  Literature Review','Chapter 3  Methodology','Chapter 4  Implementation','Chapter 5  Experimental Results','Chapter 6  Conclusion and Future Scope','References']:
    doc.add_paragraph(line)
doc.add_page_break()
doc.add_heading('List of Figures',0)
for line in ['Figure 3.1  Crop model architecture used in the training notebooks ................................ 10','Figure 4.1  AgriPredict application and assistant workflow .................................................. 12','Figure 5.1  Apple validation confusion matrix ........................................................................ 15','Figure 5.2  Apple internal-test confusion matrix .................................................................... 16','Figure 5.3  Maize validation confusion matrix ........................................................................ 17','Figure 5.4  Maize internal-test confusion matrix ................................................................... 17','Figure 5.5  Field-adapted grape confusion matrix ................................................................. 19']:
    doc.add_paragraph(line)
doc.add_page_break()
doc.add_heading('List of Tables',0)
for line in ['Table 3.1  Cleaned dataset counts and partitions ............................................................ 8','Table 3.2  Class labels and available cleaned class counts ................................................... 8','Table 3.3  Recorded crop-specific duplicate and split checks ................................................. 9','Table 3.4  Crop model architecture details ............................................................................. 10-11','Table 5.1  Validation and internal-test classification scores ................................................. 14','Table 5.2  Apple internal-test class metrics ........................................................................... 14','Tables 5.3-5.10  Crop confusion matrices ............................................................................. 19-21','Table 5.11  Crop-specific OOD evaluation results ................................................................. 21']:
    doc.add_paragraph(line)
doc.add_page_break()
doc.add_heading('Abbreviations and Acronyms',0)
add_table(doc,['Abbreviation','Meaning'],[['CNN','Convolutional Neural Network'],['OOD','Out-of-Distribution'],['RAG','Retrieval-Augmented Generation'],['ViT','Vision Transformer'],['MLN','Maize Lethal Necrosis'],['MSV','Maize Streak Virus'],['NLB','Northern Leaf Blight'],['NLS','Northern Leaf Streak'],['pHash','Perceptual hash'],['AUROC','Area Under the Receiver Operating Characteristic Curve'],['kNN','k-Nearest Neighbours']],[2,4],9)

def chapter(title):
    doc.add_page_break(); doc.add_heading(title,0)
def sec2(title): doc.add_heading(title,1)
def sec3(title): doc.add_heading(title,2)
def para(text): doc.add_paragraph(text)

chapter('Chapter 1  Introduction')
sec2('1.1 Introduction')
para('Plant disease and pest damage can reduce agricultural yield and quality. Image-based classification can help identify visible symptoms, but a result depends on the crop and disease classes represented in training data, as well as the quality and conditions of the submitted image. Research using public plant-leaf datasets has established the feasibility of deep-learning classification, while field imagery remains more variable than controlled images [1], [2].')
para('AgriPredict combines crop-specific image classification with image-quality checks and a reliability decision. It also provides disease information, weather context, and a farmer-oriented conversational assistant. The system is a decision-support application; its image result is a model prediction for the selected crop and supported class set.')
sec2('1.2 Project Context and Motivation')
para('A classifier may return a class for an unclear image or an input unlike the data used during training. AgriPredict addresses this by checking image quality before inference and, for configured models, using a rejection policy that can mark an input uncertain. The application also separates image inference from weather retrieval and conversational question answering.')
sec2('1.3 Aim and Contributions')
para('The aim is to develop and evaluate crop-specific leaf-image models and integrate them into an agricultural web application. The project records cleaned datasets and partitions for nine crop models, evaluates classification with crop-level and class-level metrics, develops ResNet50 hybrid architectures, adds selected OOD rejection policies, and implements a frontend, backend, and farmer-question assistant.')
sec2('1.4 Report Organization')
para('Chapter 2 reviews the technical background and related datasets. Chapter 3 presents data preparation, model architecture, training, and evaluation methods. Chapter 4 explains the application implementation. Chapter 5 reports the recorded classification and OOD results. Chapter 6 concludes the report and identifies future work.')

chapter('Chapter 2  Literature Review')
sec2('2.1 Literature Survey')
para('Deep convolutional networks have been used to classify plant diseases from leaf images [1], [2]. Residual connections allow deep networks to learn feature hierarchies effectively [3]. Vision Transformers apply self-attention to tokenized image features [4], and hybrid convolution-Transformer models combine local visual features with relationships across spatial regions. AgriPredict implements project-specific ResNet50 hybrid models and does not claim to reproduce an external hybrid architecture exactly.')
para('PlantDoc was introduced as a plant-disease image set containing less-controlled, field-style imagery and supports evaluation beyond highly curated images [5]. The project uses PlantDoc samples as OOD examples for selected crop workflows. OOD rejection rates depend on the tested sample set and selected thresholds, so they are reported separately from classification accuracy.')
para('Exact hashes can identify byte-identical files; perceptual hashes can surface visually similar images for review. Duplicate and near-duplicate screening helps reduce leakage between data partitions. Perceptual-hash matches are treated as candidates and reviewed rather than automatically equated with the same biological sample [6].')
sec2('2.2 Problem Statement')
para('The project addresses the problem of building crop-specific leaf-image classifiers and presenting their output through an agricultural application while identifying image-quality failures and reducing unsupported predictions for inputs outside the trained class distribution.')
sec2('2.3 Objectives')
for x in ['Prepare and document crop image datasets, class labels, and split sizes.','Train crop-specific image classifiers and select checkpoints using validation data.','Report internal-test performance using accuracy, balanced accuracy, macro-F1, and confusion matrices where recorded.','Evaluate confidence and embedding-neighbour rejection for the crop workflows with OOD experiments.','Integrate supported crop models, image checks, disease information, weather context, and a conversational assistant in AgriPredict.']:
    doc.add_paragraph(x,style='List Bullet')
sec2('2.4 Scope of Project')
para('The model evaluation covers Apple, Maize, Grapes, Tea, Potato, Cotton, Sugarcane, Groundnut, and Okra. The live application crop selector lists Apple, Maize, Grapes, Tea, Potato, Cotton, Sugarcane, and Okra [7]. Groundnut results are included as notebook model results and are not represented as live application support. Pear and Pumpkin are not covered in this report.')

chapter('Chapter 3  Methodology')
sec2('3.1 Dataset Preparation and Sources')
para('The counts in Table 3.1 describe the cleaned working data used in the project experiments. They are not the full source-archive totals unless specifically stated. The source publications and dataset records are cited in IEEE style. Dataset class names are preserved as used by each model.')
add_table_title(doc,'Table 3.1  Cleaned dataset counts and partitions')
add_table(doc,['Crop','Cleaned total','Train','Validation','Internal test','Classes / source'],[
['Apple','16,752','11,731','2,511','2,510','8 classes; AppleLeaf9 and Indigenous Apple datasets [8], [9]'],
['Maize','8,239','5,762','1,239','1,238','Healthy, MLN, MSV, NLB, NLS; Tanzania and CD&S datasets [10], [11]'],
['Grapes','5,255*','3,678','788','789','Healthy, downy mildew, powdery mildew, esca complex, erineum mite [12]'],
['Tea','1,681','1,176','252','253','Blight, Healthy Leaf, Helopeltis, Red Rust [13]'],
['Potato','2,870','2,008','431','431','Bacteria, Fungi, Healthy, Pest, Phytopthora, Virus [14]'],
['Cotton','1,648','1,149','249','250','Bacterial Blight, Curl Virus, Healthy Leaf, Leaf Hopper Jassids, Leaf Redding [15]'],
['Sugarcane','2,240','1,568','336','336','Healthy, Mosaic, RedRot, Rust, Yellow [16]'],
['Groundnut','3,036','2,125','455','456','Early leaf spot, healthy leaf, late leaf spot, nutrition deficiency, rust [17]'],
['Okra','2,799','1,959','420','420','Healthy Leaf, Insects Eaten Leaf, Leaf Curl, Leaf Spot, Yellow Vein Mosaic Virus [18]']],[.7,.8,.7,.75,.75,3.1],7.4)
para('*The primary Portuguese grape dataset forms the train/validation/internal-test split. The grape workflow also contains 358 additional field images used separately. The clean manifest total is therefore 5,613 when those field images are included.')
para('Dataset preparation retained the cleaned experiment counts rather than replacing them with source-archive totals. The original Tea record contains 2,500 naturally captured images from gardens in Habiganj, Sylhet, Bangladesh; this project used 1,681 after cleaning. The potato source contains 3,076 images across seven labels; the project excluded Nematode and used 2,870 across six classes. The sugarcane archive contained 2,521 images before cleaning to 2,240. The Groundnut publication describes 10,361 images across six source categories; this project used 3,036 images across five model classes. The cotton article describes 2,137 source images; this project used a cleaned 1,648-image subset. The Okra archive used by the project contained 4,362 images before cleaning to 2,799; the Mendeley record with the matching class names lists 4,267 images [18].')
sec2('3.2 Class Labels and Available Counts')
para('Table 3.2 lists the class labels and the class-level counts recorded in the project dataset notes. Counts are shown where supplied; class-wise values are also reported by support in confusion matrices and classification reports in Chapter 5.')
add_table_title(doc,'Table 3.2  Class labels and available cleaned class counts')
add_table(doc,['Crop','Class labels and available cleaned counts'],[
['Apple','Alternaria Leaf Spot; Brown Spot; Frogeye Leaf Spot; Mosaic; Powdery Mildew; Rust; Scab; Healthy Apple Leaf.'],
['Maize','Healthy 2,376; MLN 2,388; MSV 2,443; NLB 489; NLS 543. GLS was excluded.'],
['Grapes','Five classes: healthy, downy_mildew, powdery_mildew, esca_complex, erineum_mite.'],
['Tea','Four classes: Blight, Healthy Leaf, Helopeltis, Red Rust.'],
['Potato','Bacteria 550; Fungi 716; Healthy 197; Pest 589; Phytopthora 300; Virus 518. Nematode excluded.'],
['Cotton','Bacterial Blight, Curl Virus, Healthy Leaf, Leaf Hopper Jassids, Leaf Redding.'],
['Sugarcane','Healthy 463; Mosaic 370; RedRot 491; Rust 440; Yellow 476.'],
['Groundnut','Five model classes: early_leaf_spot, healthy leaf, late leaf spot, nutrition deficiency, rust. The source dataset describes six classes; the project model uses the five listed here.'],
['Okra','Healthy_Leaf 693; Insects_Eaten_Leaf 575; Leaf_Curl 343; Leaf_Spot 302; Yellow_Vein_Mosaic_Virus 886. Fruit_Rot excluded.']],[1,5.8],8.2)
sec2('3.3 Cleaning and Duplicate Checks')
para('The project reviewed class-folder consistency and unreadable or unsuitable samples before training. Exact duplicates were screened with SHA-256. Near-duplicate candidates were generated with perceptual hashes and visually reviewed before removal or grouping; pHash thresholds varied by crop notebook. Partition-level overlap checks were used where recorded. The crop-specific actions are summarized in Table 3.3.')
add_table_title(doc,'Table 3.3  Recorded crop-specific duplicate and split checks')
add_table(doc,['Crop','Recorded duplicate / split checks'],[
['Apple','Perceptual hash (hash size 8), Hamming distance at most 10 for candidate review across partitions; confirmed cross-split duplicates quarantined.'],
['Maize','Group-aware stratified split, seed 42; SHA-256 overlap across train, validation, and test was zero.'],
['Grapes','SHA-256 exact duplicate check; pHash candidate threshold 4 with visual review; 11 exact and 2 near duplicates removed from combined manifest.'],
['Tea','SHA-256 and EXIF-orientation robust pHash; distance 8 in primary screen and broader candidate scan to 12; visual review; PlantDoc overlap check.'],
['Potato','SHA-256 and pHash distance 8 followed by review; a tighter follow-up scan at distance 6.'],
['Cotton','SHA-256 and label-conflict checks; pHash candidates at distance 8 followed by review and group-aware partitioning.'],
['Sugarcane','Exact duplicates and reviewed near-duplicate grouping; notebook flags 17 reviewed near-duplicate pairs crossing partitions.'],
['Groundnut','Confirmed near-duplicate images removed before manifest split.'],
['Okra','Exact and visually reviewed near-duplicate images removed before final five-class split.']],[.8,6],7.7)
para('The hash settings above are candidate-screening settings recorded in the notebooks. They are not a universal definition of duplicate images. The maize split also records zero exact SHA-256 overlap; the sugarcane notebook retains a cross-partition near-duplicate flag that should be considered when interpreting the score.')
sec2('3.4 Crop Model Architectures')
para('The project does not use one identical network for every crop. ImageNet-initialized ResNet50 is the main image feature extractor. Apple and Maize use token-based Transformer heads. Grapes, Tea, Potato, Cotton, Sugarcane, and Okra use crop-specific multi-scale feature and attention designs. Groundnut uses multi-scale and spatial attention with multiple image views. Figure 3.1 summarizes these model paths; the per-crop implementation summary is given in Table 3.4.')
add_pic(doc,ROOT/'AgriPredict_Model_Architecture.png',6.5); add_caption(doc,'Figure 3.1  Crop model architecture implemented in the project notebooks.')
add_table_title(doc,'Table 3.4  Crop model architecture details')
add_table(doc,['Crop/model','Implemented architecture path'],[
['Apple','ImageNet ResNet50 without average-pool and FC produces a 2048×7×7 map. A 1×1 convolution projects 2048 to 512; flattening gives 49 tokens with learned positions. Two Transformer encoder layers use 8 heads, 2048 FFN, GELU, pre-LayerNorm, and dropout 0.2. Mean token pooling, LayerNorm, dropout, and a linear 8-class head produce logits.'],
['Maize','ResNet50 feature map projected 2048→512, 64 tokens for 256×256 input, learned positional embeddings; four Transformer encoder layers, 8 heads, FFN 2048; dropout, 256-unit GELU layer, dropout, and 5-class head.'],
['Grapes','ResNet50 layers 2, 3, and 4 supply multi-scale features; projection/fusion and spatial self-attention encode each view; full-image and tile views contribute to classification.'],
['Tea','ResNet50 multi-scale features feed gated spatial self-attention and full-image/tile views, followed by crop-specific pooling and classifier.'],
['Potato','ResNet50 multi-scale feature projection/fusion, gated spatial self-attention, and tile aggregation feed the six-class head.'],
['Cotton','ResNet50 layers 2/3/4 are projected and fused; spatial self-attention encodes a view. Full image plus four tiles are combined by mean aggregation before the classifier.'],
['Sugarcane','ResNet50 multi-scale feature fusion, spatial self-attention, and full/tile view aggregation feed the five-class classifier.'],
['Groundnut','ResNet50 layer2/3/4 pooled features are projected to 256 dimensions and combined by 4-head scale attention. Layer4 is also pooled to 7×7 and projected to 256 for 4-head spatial attention. The two 256-D features are concatenated, mapped through 512-D GELU/dropout 0.30, and classified. Three views are averaged: full leaf and two overlapping tiles.'],
['Okra','ResNet50 layers 2/3/4 are projected to 256 channels, aligned to the layer-2 grid, concatenated, fused by a 3×3 convolution, then processed by 8-head gated spatial attention. Full and tile view scores are aggregated before the five-class head.']],[.95,5.85],7.4)
sec3('Apple model layers')
para('The Apple model’s input tensor passes through the ResNet50 stem and residual stages. The final convolutional feature map has shape B×2048×7×7. A 1×1 convolution maps channels to 512 while preserving the 7×7 spatial grid. The grid is reshaped to 49 vectors, each 512-dimensional, and learned positional vectors are added. Two TransformerEncoder layers apply 8-head self-attention and a 2048-dimensional feed-forward network with GELU, dropout 0.2, and pre-normalization. The 49 contextual vectors are averaged; LayerNorm and dropout precede a fully connected 8-class output layer. The same 512-dimensional pooled representation is used by the Apple kNN reliability stage.')
sec2('3.5 Training and Checkpoint Selection')
para('Each crop notebook defines its own input preparation, augmentation, class mapping, and training configuration. Validation macro-F1 is used to select checkpoints in the documented crop pipelines; the chosen epoch is listed where recorded in Table 5.1. The internal-test split is evaluated after checkpoint selection. Configuration values that were not supplied in the evaluation record are not substituted with guessed values.')
sec2('3.6 Evaluation Metrics and OOD Policy')
para('Accuracy is the number of correct predictions divided by the evaluated sample count. Balanced accuracy is mean per-class recall. Macro-F1 is the unweighted average of class-wise F1. Confusion matrices use true class as row and predicted class as column. For OOD evaluation, selected models combine a confidence threshold and cosine kNN similarity to embeddings; samples not meeting the configured rule are marked uncertain. AUROC is given only for Apple, where the saved evaluation reports it. Other crops are reported using acceptance and rejection percentages at their selected thresholds.')

chapter('Chapter 4  Implementation')
sec2('4.1 Application Architecture')
para('The frontend is implemented with React and Vite. The backend uses FastAPI and versioned API routes. Crop selection determines the model identifier and class list. The prediction service validates the uploaded image, dispatches to the crop-specific adapter, and returns a prediction/reliability state. The user interface presents the result and disease guidance. Weather context and the assistant are separate service paths.')
add_pic(doc,ROOT/'AgriPredict_System_Architecture.png',6.5); add_caption(doc,'Figure 4.1  AgriPredict frontend, backend, image prediction, and assistant workflow.')
sec2('4.2 Frontend')
para('The React/Vite frontend provides crop selection, image upload, prediction results, and the Agriculture Assistant chat interface. The crop selector currently contains Apple, Maize, Grapes, Tea, Potato, Cotton, Sugarcane, and Okra [7]. Groundnut is not listed in that application selector; it is included in this report as a trained notebook model.')
sec2('4.3 Backend and Inference')
para('The FastAPI backend handles prediction and assistant requests. The image path uses the selected crop to load the corresponding model configuration, applies image-quality checks, runs inference, and returns the class result and reliability decision. The code checks for unreadable, blurred, poorly lit, overexposed, or low-resolution images. The system supports ACCEPT or UNCERTAIN outcomes where that model adapter provides reliability outputs.')
sec2('4.4 AgriPredict AI Assistant')
para('The Agriculture Assistant is a separate chat feature and does not change the image classifier. The assistant API accepts a question and conversation history. The configured service loads a Qwen3-0.6B language model with a QLoRA adapter, retrieves up to five relevant records from a FAISS index using all-MiniLM-L6-v2 embeddings, then constructs a response using retrieved farmer-oriented agriculture question-and-answer records. Its retrieval threshold is configured at 0.60. User-provided records include query, response, crop/asset metadata, location metadata, language, and date fields.')
sec2('4.5 Disease and Weather Information')
para('Disease guidance is supplied through crop/class-specific information. Weather is retrieved separately and displayed as contextual information. Weather is not an input feature to the image classifier. Model classification, the assistant response, and weather context remain separate outputs in the application workflow.')

chapter('Chapter 5  Experimental Results')
sec2('5.1 Classification Performance by Crop')
para('Table 5.1 consolidates the available validation and internal-test metrics from the supplied evaluation document. Accuracy is reported as a percentage; macro-F1 and balanced accuracy are decimal fractions unless indicated. The test sample count corresponds to the internal-test split. The groundnut metrics describe notebook evaluation, not live application support.')
add_table_title(doc,'Table 5.1  Validation and internal-test classification scores')
add_table(doc,['Crop','Val. acc. (%)','Val. bal. acc. (%)','Val. macro-F1','Test acc. (%)','Test bal. acc. (%)','Test macro-F1','Test n'],[
['Apple','97.01','—','0.9722','96.22','—','0.9676','2,510'],['Maize','97.26','98.11','0.9810','97.74','98.45','0.9844','1,238'],['Grapes','—','—','—','96.58','96.61','0.9661','789'],['Tea','94.84','95.06','0.9482','93.28','93.42','0.9319','253'],['Potato','89.10','88.90','0.8791','88.86','88.96','0.8807','431'],['Cotton','94.38','96.12','0.9435','92.80','94.35','0.9306','250'],['Sugarcane','—','—','0.9833','97.62','97.76','0.9763','336'],['Groundnut','92.09','93.82','0.9400','94.96','95.69','0.9611','456'],['Okra','93.81','92.93','0.9257','95.71','95.61','0.9511','420']],[.7,.78,.8,.75,.78,.8,.8,.55],7.4)
para('Maize gives the highest reported internal-test accuracy at 97.74%; Potato gives the lowest at 88.86%. Groundnut internal-test performance is 94.96% accuracy and 0.9611 macro-F1. The sugarcane validation row reports the available base-classifier macro-F1; the validation accuracy and balanced accuracy were not included in the saved evaluation summary.')
sec2('5.2 Apple Results')
para('The selected Apple checkpoint achieved 97.01% validation accuracy and 0.9722 validation macro-F1 on 2,511 images. On 2,510 internal-test images, it achieved 96.22% accuracy and 0.9676 macro-F1. Table 5.2 shows the test classification report by class; Figures 5.1 and 5.2 show the supplied validation and internal-test matrices.')
add_table_title(doc,'Table 5.2  Apple internal-test class metrics')
add_table(doc,['Apple test class','Precision','Recall','F1','Support'],[['Alternaria Leaf Spot','0.9829','0.9787','0.9808','235'],['Brown Spot','0.9821','1.0000','0.9910','55'],['Frogeye Leaf Spot','0.9621','0.9581','0.9601','477'],['Mosaic','0.9804','0.9950','0.9877','201'],['Powdery Mildew','1.0000','0.9266','0.9619','177'],['Rust','0.9619','0.9323','0.9469','325'],['Scab','0.9543','0.9614','0.9579','804'],['Healthy Apple Leaf','0.9246','0.9873','0.9549','236']],[2.2,.8,.8,.8,.65],8)
for name,cap in [('apple_validation.png','Figure 5.1  Apple best Stage-2 validation confusion matrix.'),('apple_test.png','Figure 5.2  Apple final internal-test confusion matrix.')]:
    add_pic(doc,FIGS/name,6.05); add_caption(doc,cap)
sec2('5.3 Maize and Grape Results')
para('Maize achieved 97.26% validation accuracy and 97.74% internal-test accuracy. Its test balanced accuracy was 98.45% and macro-F1 was 0.9844. The test class supports were Healthy 357, MLN 358, MSV 367, NLB 74, and NLS 82. Figures 5.3 and 5.4 show the supplied confusion matrices.')
for name,cap in [('maize_validation.png','Figure 5.3  Maize best Stage-2 validation confusion matrix.'),('maize_test.png','Figure 5.4  Maize final internal-test confusion matrix.')]:
    add_pic(doc,FIGS/name,5.8); add_caption(doc,cap)
para('The baseline Grape classifier achieved 96.58% accuracy and 0.9661 macro-F1 on 789 Portuguese internal-test images. The supplied field-adapted confusion matrix is a separate grape evaluation output and should not be treated as the baseline matrix. Its five-class entries are reported in Figure 5.5.')
add_pic(doc,FIGS/'grape_field_adapted.png',5.4); add_caption(doc,'Figure 5.5  Field-adapted grape model confusion matrix on the Portuguese internal-test set.')
sec2('5.4 Tea, Cotton, Sugarcane, Potato, Groundnut, and Okra Results')
para('Table 5.3 presents the saved internal-test confusion matrices. Each row is a true class and each column is a predicted class. The matrices preserve the crop-specific class order used in the evaluation record.')

def cm_table(title,labels,matrix,size=7.3):
    add_table_title(doc,title)
    add_table(doc,['True \\ Predicted']+labels,[[labels[i]]+row for i,row in enumerate(matrix)],size=size)
cm_table('Table 5.3  Tea validation confusion matrix',['Blight','Healthy Leaf','Helopeltis','Red Rust'],[[54,0,0,2],[0,60,0,0],[1,5,62,0],[4,1,0,63]])
cm_table('Table 5.4  Tea internal-test confusion matrix',['Blight','Healthy Leaf','Helopeltis','Red Rust'],[[51,1,0,4],[0,59,0,0],[2,2,65,0],[4,3,1,61]])
cm_table('Table 5.5  Cotton internal-test confusion matrix',['Bacterial Blight','Curl Virus','Healthy Leaf','Jassids','Redding'],[[38,0,0,0,0],[0,64,0,1,0],[0,0,27,0,0],[1,3,0,31,0],[3,3,0,7,72]])
cm_table('Table 5.6  Sugarcane internal-test confusion matrix',['Healthy','Mosaic','RedRot','Rust','Yellow'],[[69,0,0,0,0],[0,56,0,0,0],[2,0,71,1,0],[0,0,0,65,1],[0,2,0,2,67]])
cm_table('Table 5.7  Potato validation confusion matrix',['Bacteria','Fungi','Healthy','Pest','Phytopthora','Virus'],[[79,1,0,2,0,0],[0,98,2,6,1,1],[0,0,27,1,0,1],[0,5,5,78,0,1],[1,6,0,1,37,0],[1,2,7,2,1,65]],6.6)
cm_table('Table 5.8  Potato internal-test confusion matrix',['Bacteria','Fungi','Healthy','Pest','Phytopthora','Virus'],[[77,3,0,3,0,0],[1,99,0,4,3,0],[0,0,30,0,0,0],[0,4,6,78,0,0],[0,8,0,2,35,0],[2,4,6,2,0,64]],6.6)
cm_table('Table 5.9  Groundnut internal-test confusion matrix',['Early leaf spot','Healthy leaf','Late leaf spot','Nutrition deficiency','Rust'],[[118,14,0,0,0],[7,131,0,0,0],[0,0,103,0,0],[0,0,0,49,0],[1,0,1,0,32]],7)
cm_table('Table 5.10  Okra internal-test confusion matrix',['Healthy Leaf','Insects Eaten','Leaf Curl','Leaf Spot','Yellow Vein Mosaic'],[[103,0,1,0,0],[5,76,1,4,0],[0,1,51,0,0],[0,1,1,43,0],[1,2,1,0,129]],7)
para('The Groundnut test matrix shows the main confusion between early leaf spot and healthy leaf: 14 early leaf spot images were predicted as healthy, and 7 healthy images were predicted as early leaf spot. All recorded late leaf spot and nutrition-deficiency test images were classified correctly in this matrix.')
sec2('5.5 Out-of-Distribution Evaluation')
para('The OOD results below are the recorded outcomes at the selected crop-specific operating thresholds. Apple is the only model with an AUROC value in the evaluation record. Rejection percentages are not AUROC values.')
add_table_title(doc,'Table 5.11  Crop-specific OOD evaluation results')
add_table(doc,['Crop','Calibration rule','In-distribution test','Held-out OOD test','Other recorded result'],[
['Apple','kNN K=10; threshold 0.9357','95.30% accepted (2,510)','83.09% rejected (207 non-Apple PlantDoc)','AUROC 0.9631'],
['Grapes','kNN threshold 0.916923; confidence 0.594393','98.7% accepted (789); accepted accuracy 97.0%','99.5% rejected (205 other-crop); 74.0% (50 unsupported grape)','Black Rot rejected 90%; Leaf Blight 70%'],
['Tea','Confidence 0.2686 and kNN 0.8942; K=10','237/253 accepted (93.7%); pre-rejection accuracy 90.91%, macro-F1 0.9071','226/228 PlantDoc rejected (99.1%)','Accepted-image accuracy 92.83%; no AUROC reported'],
['Cotton','Frozen confidence + kNN policy','246/250 accepted; 4 rejected; accepted-image accuracy 93.09%','78/236 PlantDoc test rejected (33.05%); validation rejection 91/271 (33.58%)','One grape image accepted as Leaf Redding'],
['Sugarcane','Confidence 0.57815 and kNN 0.8175; K=10','325/336 accepted (96.7%); pre-rejection accuracy 91.96%, macro-F1 0.9182','204/228 PlantDoc rejected (89.5%)','Accepted-image accuracy 93.85%; no AUROC reported'],
['Okra','Confidence 0.3917 and kNN 0.9663; K=10','414/420 accepted (98.6%); pre-rejection accuracy 95.24%, macro-F1 0.9431','227/228 PlantDoc rejected (99.6%)','Accepted-image accuracy 95.89%; no AUROC reported'],
['Maize, Potato, Groundnut','—','—','—','No OOD evaluation result recorded']],[.7,1.35,1.65,1.55,1.7],6.8)
chapter('Chapter 6  Conclusion and Future Scope')
sec2('6.1 Conclusion')
para('AgriPredict brings crop-specific leaf-image classification and agricultural support services into a web application. Nine trained crop models are documented in the experiments, while the application crop selector currently exposes eight crops; Groundnut is therefore reported as a notebook model rather than an enabled application model. The project uses ResNet50 with crop-specific Transformer, multi-scale attention, spatial attention, and tile-view components. Internal-test accuracy ranges from 88.86% for Potato to 97.74% for Maize. Selected OOD workflows add a reject/uncertain outcome and are reported with crop-specific coverage and rejection results.')
sec2('6.2 Future Scope')
for x in ['Extend the application model registry and user interface for notebook-trained crop models after integrating their packages and validating label mappings.','Collect independent field images across locations, devices, cultivars, and disease stages for external evaluation.','Repeat OOD evaluation across the full supported crop list using fixed calibration and held-out test sets.','Review cross-partition near-duplicate cases flagged in the sugarcane workflow before treating its evaluation as final.','Measure end-to-end inference time and evaluate application usability with intended users.','Evaluate the Agriculture Assistant for retrieval relevance, factual correctness, and safe handling of agricultural questions.']:
    doc.add_paragraph(x,style='List Bullet')

doc.add_page_break(); doc.add_heading('References',0)
refs=[
'D. P. Hughes and M. Salathé, “An open access repository of images on plant health to enable the development of mobile disease diagnostics,” arXiv:1511.08060, 2015.',
'S. P. Mohanty, D. P. Hughes, and M. Salathé, “Using deep learning for image-based plant disease detection,” Front. Plant Sci., vol. 7, Art. no. 1419, 2016, doi: 10.3389/fpls.2016.01419.',
'K. He, X. Zhang, S. Ren, and J. Sun, “Deep residual learning for image recognition,” in Proc. IEEE Conf. Comput. Vis. Pattern Recognit. (CVPR), 2016, pp. 770–778, doi: 10.1109/CVPR.2016.90.',
'A. Dosovitskiy et al., “An image is worth 16×16 words: Transformers for image recognition at scale,” in Proc. Int. Conf. Learn. Represent. (ICLR), 2021.',
'D. Singh et al., “PlantDoc: A dataset for visual plant disease detection,” in Proc. 7th ACM IKDD CoDS and 25th COMAD, 2020, pp. 249–253, doi: 10.1145/3371158.3371196.',
'D. McKeown and B. Buchanan, “Hamming distributions of popular perceptual hashing techniques,” Forensic Sci. Int.: Digit. Investig., vol. 44, Art. no. 301509, 2023, doi: 10.1016/j.fsidi.2023.301509.',
'AgriPredict project, “Crop selector,” frontend source code, accessed Oct. 20, 2026.',
'Q. Yang et al., “Efficient identification of apple leaf diseases in the wild using CNN,” Agronomy, vol. 12, no. 11, Art. no. 2784, 2022, doi: 10.3390/agronomy12112784.',
'A. M. Yatoo and A. Sharma, “An Indigenous dataset for detection and classification of apple leaf diseases,” Data Brief, vol. 53, Art. no. 110165, 2024, doi: 10.1016/j.dib.2024.110165.',
'N. Mduma and L. Laizer, “Maize leaf disease dataset,” Zenodo, 2025, doi: 10.5281/zenodo.15685236.',
'A. Ahmad et al., “CD&S: A dataset for crop disease and stress recognition,” arXiv:2110.12084, 2021.',
'J. Portela et al., “A Portuguese grape leaf disease image dataset,” Data Brief, vol. 66, Art. no. 112743, 2026, doi: 10.1016/j.dib.2026.112743.',
'S. H. Chowdhury and M. S. Arman, “Tea leaf disease image dataset for automated classification of tea garden diseases,” Mendeley Data, ver. 1, Oct. 30, 2025, doi: 10.17632/3x42rbj8yv.1.',
'N. H. Shabrina et al., “A novel dataset of potato leaf disease in uncontrolled environment,” Data Brief, vol. 52, Art. no. 109955, 2024, doi: 10.1016/j.dib.2023.109955.',
'M. Bishshash et al., “SAR-CLD-2024: A comprehensive dataset for cotton leaf disease detection,” Data Brief, vol. 57, Art. no. 110913, 2024, doi: 10.1016/j.dib.2024.110913.',
'S. D. Daphal and S. M. Koli, “Enhanced deep learning technique for sugarcane leaf disease classification and mobile application integration,” Heliyon, vol. 10, no. 8, Art. no. e29438, 2024, doi: 10.1016/j.heliyon.2024.e29438.',
'M. P. Aishwarya and A. P. Reddy, “Dataset of groundnut plant leaf images for classification and detection,” Data Brief, vol. 48, Art. no. 109185, 2023, doi: 10.1016/j.dib.2023.109185.',
'“A Diverse Field Image Dataset of Okra Plant Diseases,” Mendeley Data, doi: 10.17632/tdcmkjv3yr.1.'
]
for i,ref in enumerate(refs,1):
    p=doc.add_paragraph(); p.paragraph_format.left_indent=Inches(.3); p.paragraph_format.first_line_indent=Inches(-.3); p.paragraph_format.space_after=Pt(4)
    r=p.add_run(f'[{i}] {ref}'); r.font.name='Times New Roman'; r.font.size=Pt(9)
doc.save(OUT)
print(OUT)
