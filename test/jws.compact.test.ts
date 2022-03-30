import { ErrorCode } from "../src/error.js";
import { checkErrors } from "./utils.js";
import jws_compact from '../src/jws.compact.js';
import jws_flat from '../src/jws.flat.js';
import shc_decoder from '../src/shc.js';
import Context from '../src/context.js';
import { JWSCompact } from '../src/types.js';


const validCjws = 'eyJ6aXAiOiJERUYiLCJhbGciOiJFUzI1NiIsImtpZCI6IjNLZmRnLVh3UC03Z1h5eXd0VWZVQUR3QnVtRE9QS01ReC1pRUxMMTFXOXMifQ.3ZJNj9MwEIb_ymq4pokTSktzo0XiSyAQy15QD64zbYz8EfkjalnlvzN2u2JBu3viRG6TmXn8vq99C9J7aKEPYfBtVfkBRek1d6FHrkJfCu46X-GR60Ghr2g6ooMCzG4Pbb2YL9jL56xhZT2vCxgFtLcQTgNC-_0382_cs3MxSwWhHp-TWkcjf_IgrXlyUNhRdvUKtgUIhx2aILn6Gnc_UIQkad9Ld4POJ04L85L0Ei_9XUfTKUwzDr2NTuB1lg-XRnGxA8IqRbSzEjrAncgjkaNS35yigbv9ltHAXfEA-DPZof2UIdd4hnAtFfHglaEZ5_MZBzmiSTm-t32q1yVsJzK4k2T-NQ-JVa9e1DNWzxoG01Q8qKZ-Ws27PyP2gYfos9104QHTBY1cCGlwY7tMELaT5pCF-5MPqC_vh26mV8vSukOVkq287CoxHgkg8iY0bAnTdipguESQ5ezRoUna7idIQ1aI6HIrmb2W-oxosmGWbFFUe-s0vcekhYtgXUJ20g-K5zjXm6s3aNBxdfXW-kEGrigoClHZ8CnqXVoFlr_60QSb_zLBZvWvE1ymBoUITnb08-OH0-bYL4dF_EKNXw.qIxp8j32EzRItn7hHrIfFKX163qlyYMMQ30fkYjOwl0Cgy5ssR9Oypas-KK-3AUFygu7mDrQmBGMiw44wgUqug';
const validShc = 'shc:/5676290952432060346029243740446031222959532654603460292540772804336028702864716745222809286133314564376531415906402203064504590856435503414245413640370636654171372412363803043756220467374075323239254334433260573601064529295312707424284350386122127671665437102572713671033607704238437029573022677054422260112125702173667306552834055853292365044133042632503575734057565806203442726012270475532526082065617325693400373855506565336534254359585267236622676634522224237355042142040455776757775641327211727325553644615950445650272520523412003275506143670530423874281257765440226766114533084457383158127632666872427032642042007536561127623955610036340961672503731027560331652952723277317322295650317030726732444576740924767727057636577766067053205607624529662976410358230538377628273053124538363235000504292074502524002073452857054407453207366522632923245812565245687531450077256023696400322703704110637029652807255236003957323704520443253877706769412940753912683852096440041050003405276564580371050707411061215403327009257569436724662653397259122472093477683209737500096441070572532710286045533433244157237436583055336832702667700540744322342832654566404055715705452820034577663333694261054168583966620926760560316671664568005812376005325605326170593372622277257241675773244233637064315511443374613329364126280373613536420661306739676808083370350773240976435077692129614466373122606608005735591043591007456970294352737422014372290354263611113564390855693371766453456020201041213628303826056145536361557511266952640658333043617603617020235911722366353055546212035024301262092630333130643411765820';


/**
 * 
 * Decode
 * 
 */
test('jws-compact-decode', async () => {
    const context = new Context();
    context.compact = validCjws;
    jws_compact.decode(context);
    jws_flat.validate(context);
    checkErrors(context);
});


/**
 * 
 * Bad paramerters
 * 
 */
test('jws-compact-decode-null', async () => {
    const context = new Context();
    context.compact = null as unknown as JWSCompact;
    jws_compact.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('jws-compact-decode-undefined', async () => {
    const context = new Context();
    context.compact = undefined as unknown as JWSCompact;
    jws_compact.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('jws-compact-decodec-number-0', async () => {
    const context = new Context();
    context.compact = 0 as unknown as JWSCompact;
    jws_compact.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('jws-compact-decode-number-1', async () => {
    const context = new Context();
    context.compact = 1 as unknown as JWSCompact;
    jws_compact.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('jws-compact-decode-object', async () => {
    const context = new Context();
    context.compact = {} as unknown as JWSCompact;
    jws_compact.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('jws-compact-decode-boolean', async () => {
    const context = new Context();
    context.compact = true as unknown as JWSCompact;
    jws_compact.decode(context);
    checkErrors(context, ErrorCode.PARAMETER_INVALID);
});

test('jws-compact-decode-string-empty', async () => {
    const context = new Context();
    context.compact = '';
    jws_compact.decode(context);
    checkErrors(context, ErrorCode.JWS_COMPACT_FORMAT_ERROR);
});

test('jws-compact-decode-odd-numeric', async () => {
    const context = new Context();
    context.compact = 'shc:/12345';
    jws_compact.decode(context);
    checkErrors(context, ErrorCode.JWS_COMPACT_FORMAT_ERROR);
});


/**
 * 
 * Validate
 * 
 */
test('jws-compact-validate', async () => {
    const context = new Context();
    context.compact = validCjws;
    jws_compact.validate(context);
    checkErrors(context);
});


/**
 * 
 * Encode
 * 
 */
test('jws-compact-encode-to-shc', async () => {
    const context = new Context();
    context.shc = validShc;
    await shc_decoder.decode(context);
    jws_compact.encode(context);
    checkErrors(context);
    expect(context.shc).toEqual(validShc);
});
