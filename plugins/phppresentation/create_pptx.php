<?php

// with Composer
require_once './vendor/autoload.php';


use PhpOffice\PhpPresentation\PhpPresentation;
use PhpOffice\PhpPresentation\IOFactory;
use PhpOffice\PhpPresentation\Style\Color;
use PhpOffice\PhpPresentation\Style\font;
use PhpOffice\PhpPresentation\Style\Alignment;
use PhpOffice\PhpPresentation\Shape\Drawing\File;
use PhpOffice\PhpPresentation\Slide\Background\Image;
use PhpOffice\PhpPresentation\ComparableInterface;

// $slide_id = $_POST["slide_id"];             //スライドID


$objPHPPowerPoint = new PhpPresentation();

for ($i = 0; $i <3 ; $i++)
  {
// Create slide
$oSlide = $objPHPPowerPoint->createSlide();

// //create title
$title = $oSlide->createRichTextShape()
      ->setHeight(120)
      ->setWidth(800)
      ->setOffsetX(70)
      ->setOffsetY(50);
//
$textRun2 = $title->createTextRun('title!');
$textRun2->getFont()->setBold(true)
                   ->setSize(30)
                   ->setColor( new Color( '19a9e1' ) )
                   ->setName("roboto");
//
//create text
$shape = $oSlide->createRichTextShape()
      ->setHeight(450)
      ->setWidth(800)
      ->setOffsetX(75)
      ->setOffsetY(200);
//
$shape->getActiveParagraph()->getAlignment()->setHorizontal( Alignment::HORIZONTAL_CENTER );
$textRun = $shape->createTextRun('the description!');
$textRun->getFont()->setBold(true)
                   ->setSize(30)
                   ->setColor( new Color( '19a9e1' ) )
                   ->setName("roboto");

//
//
//
// // //add image to the background
// $oBkgImage = new Image();
// $oBkgImage->setPath('./vendor/phpoffice/phppresentation/samples/resources/background.png');
// $oSlide->setBackground($oBkgImage);

}
//
// //save
$oWriterPPTX = IOFactory::createWriter($objPHPPowerPoint, 'PowerPoint2007');
$oWriterPPTX->save(__DIR__ . "/presentation.pptx");
