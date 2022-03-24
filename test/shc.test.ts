import { ErrorCode } from "../src/error";
import { checkErrors } from "./utils.js";
import shc from '../src/shc';
import Context from "../src/context";
import { QRUrl } from "../src/types";


const validShc = 'shc:/5676290952432060346029243740446031222959532654603460292540772804336028702864716745222809286133314564376531415906402203064504590856435503414245413640370636654171372412363803043756220467374075323239254334433260573601064529295312707424284350386122127671665437102572713671033607704238437029573022677054422260112125702173667306552834055853292365044133042632503575734057565806203442726012270475532526082065617325693400373855506565336534254359585267236622676634522224237355042142040455776757775641327211727325553644615950445650272520523412003275506143670530423874281257765440226766114533084457383158127632666872427032642042007536561127623955610036340961672503731027560331652952723277317322295650317030726732444576740924767727057636577766067053205607624529662976410358230538377628273053124538363235000504292074502524002073452857054407453207366522632923245812565245687531450077256023696400322703704110637029652807255236003957323704520443253877706769412940753912683852096440041050003405276564580371050707411061215403327009257569436724662653397259122472093477683209737500096441070572532710286045533433244157237436583055336832702667700540744322342832654566404055715705452820034577663333694261054168583966620926760560316671664568005812376005325605326170593372622277257241675773244233637064315511443374613329364126280373613536420661306739676808083370350773240976435077692129614466373122606608005735591043591007456970294352737422014372290354263611113564390855693371766453456020201041213628303826056145536361557511266952640658333043617603617020235911722366353055546212035024301262092630333130643411765820';




/**
 * 
 * Bad paramerters
 * 
 */
test('shc-decode-null', async () => {
    const context = new Context();
    context.shc = null as unknown as string;
    shc.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('shc-decode-undefined', async () => {
    const context = new Context();
    context.shc = undefined as unknown as string;
    shc.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('shc-decodec-number-0', async () => {
    const context = new Context();
    context.shc = 0 as unknown as string;
    shc.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('shc-decode-number-1', async () => {
    const context = new Context();
    context.shc = 1 as unknown as string;
    shc.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('shc-decode-object', async () => {
    const context = new Context();
    context.shc = {} as unknown as string;
    shc.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('shc-decode-boolean', async () => {
    const context = new Context();
    context.shc = true as unknown as string;
    shc.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('shc-decode-string-empty', async () => {
    const context = new Context();
    context.shc = '' as unknown as string;
    shc.decode(context);
    checkErrors(context, ErrorCode.SHC_FORMAT_ERROR);
});

test('shc-decode-odd-numeric', async () => {
    const context = new Context();
    context.shc = 'shc:/1234567';
    shc.decode(context);
    checkErrors(context, ErrorCode.SHC_FORMAT_ERROR);
});




/**
 * 
 * Validate
 * 
 */
test('shc-validate', async () => {
    const context = new Context();
    context.shc = validShc;
    shc.validate(context);
    checkErrors(context);
});

test('shc-validate-wrong', async () => {
    const context = new Context();
    context.shc = 'blah blah blah';
    shc.validate(context);
    checkErrors(context, ErrorCode.SHC_FORMAT_ERROR);
});




/**
 * 
 * Encode
 * 
 */
 test('shc-encode-to-qr-url', async () => {
    const context = new Context();
    context.shc = validShc;
    await shc.encode(context);
    checkErrors(context);
    expect(/data:image\/png;base64,[0-9A-Za-z+\/]+={0,2}/.test(context.qr as QRUrl)).toEqual(true);
});
