interface MasterSNP {
    rsId: string;
    geneName: string;
    geneSummary: string;
    chromosome: number;
    position_GRCh38: number;
    referenceAllele: string;
    altAllele: string;
}

export const organizationId = 2
export const masterSNPs: MasterSNP[] = [
    {
        rsId: "rs1009977",
        geneName: "LGALS3",
        geneSummary: `This gene encodes a member of the galectin family of carbohydrate binding proteins. Members of this protein family have an affinity for beta-galactosides. The encoded protein is characterized by an N-terminal proline-rich tandem repeat domain and a single C-terminal carbohydrate recognition domain. This protein can self-associate through the N-terminal domain allowing it to bind to multivalent saccharide ligands. This protein localizes to the extracellular matrix, the cytoplasm and the nucleus. This protein plays a role in numerous cellular functions including apoptosis, innate immunity, cell adhesion and T-cell regulation. The protein exhibits antimicrobial activity against bacteria and fungi. Alternate splicing results in multiple transcript variants.`,
        chromosome: 14,
        position_GRCh38: 55136284,
        referenceAllele: "T",
        altAllele: "G"
    },
    {
        rsId: "rs1042580",
        geneName: "THBD",
        geneSummary: `The protein encoded by this intronless gene is an endothelial-specific type I membrane receptor that binds thrombin. This binding results in the activation of protein C, which degrades clotting factors Va and VIIIa and reduces the amount of thrombin generated. Mutations in this gene are a cause of thromboembolic disease, also known as inherited thrombophilia.`,
        chromosome: 20,
        position_GRCh38: 23046984,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs1045642",
        geneName: "ABCB1",
        geneSummary: `The membrane-associated protein encoded by this gene is a member of the superfamily of ATP-binding cassette (ABC) transporters. ABC proteins transport various molecules across extra- and intra-cellular membranes. ABC genes are divided into seven distinct subfamilies (ABC1, MDR/TAP, MRP, ALD, OABP, GCN20, White). This protein is a member of the MDR/TAP subfamily. Members of the MDR/TAP subfamily are involved in multidrug resistance. The protein encoded by this gene is an ATP-dependent drug efflux pump for xenobiotic compounds with broad substrate specificity. It is responsible for decreased drug accumulation in multidrug-resistant cells and often mediates the development of resistance to anticancer drugs. This protein also functions as a transporter in the blood-brain barrier. Mutations in this gene are associated with colchicine resistance and Inflammatory bowel disease 13. Alternative splicing and the use of alternative promoters results in multiple transcript variants.`,
        chromosome: 7,
        position_GRCh38: 87509329,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs1047303",
        geneName: "HSD3B1",
        geneSummary: `HSD3B1 (3β-hydroxysteroid dehydrogenase type 1) is a gatekeeper in steroid synthesis: it converts DHEA → androstenedione, pregnenolone → progesterone, and interconverts 3-hydroxy/3-keto androstane steroids, feeding downstream production of testosterone, DHT, and estradiol in peripheral tissues. The rs1047303 coding change can shift 3β-HSD1 efficiency, which may influence baseline androgen availability (especially from adrenal precursors), with real-world effects on libido, energy, body-composition, prostate physiology, and training recovery. Think of it as an upstream throttle on how readily your body can turn precursors into active sex steroids; support balanced outcomes with resistance + aerobic training, adequate protein/micronutrients (zinc, B-vitamins), sleep consistency, and moderated alcohol.`,
        chromosome: 1,
        position_GRCh38: 119514623,
        referenceAllele: "C",
        altAllele: "A"
    },
    {
        rsId: "rs1048943",
        geneName: "CYP1A1",
        geneSummary: `CYP1A1 is a Phase I cytochrome P450 enzyme that helps clear circulating estrogens via hydroxylation. In men, CYP1A1 activity influences the estradiol:testosterone (E2:T) balance, affecting libido, fat distribution, gynecomastia risk, and vascular tone. The rs1048943 variant can alter enzyme function and the rate of estrogen clearance, indirectly impacting androgen signaling by shifting how much estradiol is produced from aromatization and how quickly it’s metabolized.`,
        chromosome: 15,
        position_GRCh38: 74720644,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs1049353",
        geneName: "CNR1",
        geneSummary: `CNR1 codes for the cannabinoid type 1 (CB1) receptor. Studies of CNR1 gene variants show mixed but suggestive associations with multiple psychiatric conditions. Research has focused on promoter repeat polymorphisms and several intragenic SNPs, with both positive and negative findings across disorders such as substance dependence, schizophrenia, eating disorders, Tourette syndrome, bipolar disorder, and psychiatric symptoms in Parkinson’s disease. Although results are not fully consistent, the overall evidence supports a potential role of CNR1 in vulnerability to a range of psychiatric traits.`,
        chromosome: 6,
        position_GRCh38: 88143916,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs1056836",
        geneName: "CYP1B1",
        geneSummary: `The CYP1B1 gene codes for a protein that is a member of the cytochrome P450 family, which play a crucial role in breaking down and processing various substances within your body, such as estrogen. This is particularly important during menopause, where the body begins to shut down many of its estrogen-producing pathways. As a result, the breakdown of remaining circulating estrogen by cytochrome P450 enzymes can exacerbate the symptoms that arise from menopause. Genetic variations in these genes and their enzymes can affect their function and the symptoms that result, especially under menopausal conditions.`,
        chromosome: 2,
        position_GRCh38: 38071060,
        referenceAllele: "G",
        altAllele: "C"
    },
    {
        rsId: "rs1061170",
        geneName: "CFH (Y402H)",
        geneSummary: `This gene is a member of the Regulator of Complement Activation (RCA) gene cluster and encodes a protein with twenty short consensus repeat (SCR) domains. This protein is secreted into the bloodstream and has an essential role in the regulation of complement activation, restricting this innate defense mechanism to microbial infections. Mutations in this gene have been associated with hemolytic-uremic syndrome (HUS) and chronic hypocomplementemic nephropathy. Alternate transcriptional splice variants, encoding different isoforms, have been characterized.`,
        chromosome: 1,
        position_GRCh38: 196690107,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs11030104",
        geneName: "BDNF",
        geneSummary: `This gene encodes a member of the nerve growth factor family of proteins. Alternative splicing results in multiple transcript variants, at least one of which encodes a preproprotein that is proteolytically processed to generate the mature protein. Binding of this protein to its cognate receptor promotes neuronal survival in the adult brain. Expression of this gene is reduced in Alzheimer's, Parkinson's, and Huntington's disease patients. This gene may play a role in the regulation of the stress response and in the biology of mood disorders.`,
        chromosome: 11,
        position_GRCh38: 27662970,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs110402",
        geneName: "CRHR1",
        geneSummary: `This gene encodes a G-protein coupled receptor that binds neuropeptides of the corticotropin releasing hormone family that are major regulators of the hypothalamic-pituitary-adrenal pathway. The encoded protein is essential for the activation of signal transduction pathways that regulate diverse physiological processes including stress, reproduction, immune response and obesity. Alternative splicing results in multiple transcript variants. Naturally-occurring readthrough transcription between this gene and upstream GeneID:147081 results in transcripts that encode isoforms that share similarity with the products of this gene.`,
        chromosome: 17,
        position_GRCh38: 45802681,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs11136000",
        geneName: "CLU",
        geneSummary: `The protein encoded by this gene is a secreted chaperone that can under some stress conditions also be found in the cell cytosol. It has been suggested to be involved in several basic biological events such as cell death, tumor progression, and neurodegenerative disorders. Alternate splicing results in both coding and non-coding variants.`,
        chromosome: 8,
        position_GRCh38: 27607002,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs11196288",
        geneName: "HABP2",
        geneSummary: `This gene encodes a member of the peptidase S1 family of serine proteases. The encoded preproprotein is secreted by hepatocytes and proteolytically processed to generate heavy and light chains that form the mature heterodimer. Further autoproteolysis leads to smaller, inactive peptides. This extracellular protease binds hyaluronic acid and may play a role in the coagulation and fibrinolysis systems. Mutations in this gene are associated with nonmedullary thyroid cancer and susceptibility to venous thromboembolism. Alternative splicing results in multiple transcript variants, at least one of which encodes a preproprotein that is proteolytically processed.`,
        chromosome: 10,
        position_GRCh38: 113297684,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs1137070",
        geneName: "MAOA",
        geneSummary: `MAOA, also known as the "warrior gene," plays a role in breaking down certain neurotransmitters in our brain, such as serotonin and dopamine. These neurotransmitters are part of the neural circuits that influence our mood, emotions, and behavior. MAOA helps regulate their levels, affecting how we respond to stress and emotional situations. Neurotransmitters need to remain in constant balance, or homeostasis, and MAOA’s role in maintaining that balance is by breaking down these chemical signals after they’ve done their job. However, some people may have genetic variations in the MAOA gene that can impact how this gene functions. While the "warrior gene" nickname might sound intense, it's essential to understand that having these genetic variations doesn't determine our behavior entirely. Environmental factors and personal experiences also play a significant role in shaping who we are. Regardless, knowledge of your genetic profile may help understand any potential changes you’ve experienced during menopause.`,
        chromosome: 23,
        position_GRCh38: 43744144,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs1137101",
        geneName: "LEPR",
        geneSummary: `Leptin is a hormone that regulates appetite and body weight. When we eat, our fat cells release leptin, which travels through our bloodstream to our brain and helps us feel satisfied and reduces our hunger. It acts as a satiety, or “fullness,” signal by binding to its receptor in the brain. LEPR is the gene that codes for this receptor, and SNPs in this gene can impact leptin’s impact in regulating satiety. The impact of these SNPs can be affected by the hormone changes seen during menopause, which may play a role in weight gain. Knowledge about your genetic background can help you understand risk factors associated with changes to your weight and metabolism seen during menopause.`,
        chromosome: 1,
        position_GRCh38: 65592830,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs115539978",
        geneName: "Intergenic variant",
        geneSummary: "This gene encodes a protein that is responsible for the hydrolysis of a number of primary and secondary fatty acid amides, including the neuromodulatory compounds anandamide and oleamide.",
        chromosome: 13,
        position_GRCh38: 55185074,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs11568822",
        geneName: "APOC1",
        geneSummary: `This gene encodes a member of the apolipoprotein C1 family. This gene is expressed primarily in the liver, and it is activated when monocytes differentiate into macrophages. The encoded protein plays a central role in high density lipoprotein (HDL) and very low density lipoprotein (VLDL) metabolism. This protein has also been shown to inhibit cholesteryl ester transfer protein in plasma. A pseudogene of this gene is located 4 kb downstream in the same orientation, on the same chromosome. This gene is mapped to chromosome 19, where it resides within a apolipoprotein gene cluster. Alternative splicing and the use of alternative promoters results in multiple transcript variants.`,
        chromosome: 19,
        position_GRCh38: 44914381,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs11668344",
        geneName: "TMEM150B",
        geneSummary: `TMEM150B is a gene that carries instructions for making a protein located on the membrane of cells within the ovary. While its exact functions are still being studied, research suggests that TMEM150B may play a role in cell communication and a process called autophagy, where your body recycles parts from old or damaged cells. Variations in the TMEM150B gene can impact aspects of the autophagy pathway within the ovaries, which is believed to impact an individual's age of menopause and fertility window.`,
        chromosome: 19,
        position_GRCh38: 55322296,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs11754661",
        geneName: "MTHFD1L",
        geneSummary: `The protein encoded by this gene is involved in the synthesis of tetrahydrofolate (THF) in the mitochondrion. THF is important in the de novo synthesis of purines and thymidylate and in the regeneration of methionine from homocysteine. Several transcript variants encoding different isoforms have been found for this gene.`,
        chromosome: 6,
        position_GRCh38: 150885942,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs11792633",
        geneName: "IL33",
        geneSummary: `The protein encoded by this gene is a cytokine that binds to the IL1RL1/ST2 receptor. The encoded protein is involved in the maturation of Th2 cells and the activation of mast cells, basophils, eosinophils and natural killer cells. Several transcript variants encoding different isoforms have been found for this gene.`,
        chromosome: 9,
        position_GRCh38: 6248035,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs12086634",
        geneName: "HSD11B1",
        geneSummary: `The protein encoded by this gene is a microsomal enzyme that catalyzes the conversion of the stress hormone cortisol to the inactive metabolite cortisone. In addition, the encoded protein can catalyze the reverse reaction, the conversion of cortisone to cortisol. Too much cortisol can lead to central obesity, and a particular variation in this gene has been associated with obesity and insulin resistance in children. Mutations in this gene and H6PD (hexose-6-phosphate dehydrogenase (glucose 1-dehydrogenase)) are the cause of cortisone reductase deficiency. Alternate splicing results in multiple transcript variants encoding the same protein.`,
        chromosome: 1,
        position_GRCh38: 209706914,
        referenceAllele: "T",
        altAllele: "G"
    },
    {
        rsId: "rs12325817",
        geneName: "PEMT",
        geneSummary: `Phosphatidylcholine (PC) is the most abundant mammalian phospholipid. This gene encodes an enzyme which converts phosphatidylethanolamine to phosphatidylcholine by sequential methylation in the liver. Another distinct synthetic pathway in nucleated cells converts intracellular choline to phosphatidylcholine by a three-step process. The protein isoforms encoded by this gene localize to the endoplasmic reticulum and mitochondria-associated membranes. Alternate splicing of this gene results in multiple transcript variants encoding different isoforms.`,
        chromosome: 17,
        position_GRCh38: 17583205,
        referenceAllele: "C",
        altAllele: "G"
    },
    {
        rsId: "rs13107325",
        geneName: "SLC39A8",
        geneSummary: `This gene encodes a member of the SLC39 family of solute-carrier genes, which show structural characteristics of zinc transporters. The encoded protein is glycosylated and found in the plasma membrane and mitochondria, and functions in the cellular import of zinc at the onset of inflammation. It is also thought to be the primary transporter of the toxic cation cadmium, which is found in cigarette smoke. Multiple transcript variants encoding different isoforms have been found for this gene. Additional alternatively spliced transcript variants of this gene have been described, but their full-length nature is not known.`,
        chromosome: 4,
        position_GRCh38: 102267552,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs13143308",
        geneName: "PITX2",
        geneSummary: `This gene encodes a member of the RIEG/PITX homeobox family, which is in the bicoid class of homeodomain proteins. The encoded protein acts as a transcription factor and regulates procollagen lysyl hydroxylase gene expression. This protein plays a role in the terminal differentiation of somatotroph and lactotroph cell phenotypes, is involved in the development of the eye, tooth and abdominal organs, and acts as a transcriptional regulator involved in basal and hormone-regulated activity of prolactin. Mutations in this gene are associated with Axenfeld-Rieger syndrome, iridogoniodysgenesis syndrome, and sporadic cases of Peters anomaly. A similar protein in other vertebrates is involved in the determination of left-right asymmetry during development. Alternatively spliced transcript variants encoding distinct isoforms have been described.`,
        chromosome: 4,
        position_GRCh38: 110793263,
        referenceAllele: "T",
        altAllele: "G"
    },
    {
        rsId: "rs1341239",
        geneName: "PRL",
        geneSummary: `This gene encodes the anterior pituitary hormone prolactin. This secreted hormone is a growth regulator for many tissues, including cells of the immune system. It may also play a role in cell survival by suppressing apoptosis, and it is essential for lactation. Alternative splicing results in multiple transcript variants that encode the same protein.`,
        chromosome: 6,
        position_GRCh38: 22303975,
        referenceAllele: "A",
        altAllele: "C"
    },
    {
        rsId: "rs1360780",
        geneName: "FKBP5",
        geneSummary: `FKBP5 is a co-chaperone that tunes glucocorticoid receptor (cortisol) sensitivity. The rs1360780 setting can shift how quickly the body shuts off a stress response (negative feedback), effectively changing your cortisol “gain.” In men, that tuning can influence sleep quality, morning alertness and testosterone rhythm, abdominal fat tendency, mood/irritability, and training recovery—because prolonged or higher cortisol pulses transiently dampen testosterone and blunt anabolism. Think of this SNP as a stress-response dial, not a diagnosis. Helpful levers: consistent sleep/wake timing, strong morning light, a base of zone-2 + resistance training, protein + fiber with moderated alcohol, and nightly wind-down (low light, breath work) to keep cortisol—and thus hormones—on a healthy rhythm.`,
        chromosome: 6,
        position_GRCh38: 35639794,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs1401296",
        geneName: "PROC",
        geneSummary: `This gene encodes a vitamin K-dependent plasma glycoprotein. The encoded protein is cleaved to its activated form by the thrombin-thrombomodulin complex. This activated form contains a serine protease domain and functions in degradation of the activated forms of coagulation factors V and VIII. Mutations in this gene have been associated with thrombophilia due to protein C deficiency, neonatal purpura fulminans, and recurrent venous thrombosis.`,
        chromosome: 2,
        position_GRCh38: 127431732,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs1491850",
        geneName: "BDNF",
        geneSummary: `This gene encodes a member of the nerve growth factor family of proteins. Alternative splicing results in multiple transcript variants, at least one of which encodes a preproprotein that is proteolytically processed to generate the mature protein. Binding of this protein to its cognate receptor promotes neuronal survival in the adult brain. Expression of this gene is reduced in Alzheimer's, Parkinson's, and Huntington's disease patients. This gene may play a role in the regulation of the stress response and in the biology of mood disorders.`,
        chromosome: 11,
        position_GRCh38: 27728178,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs16991615",
        geneName: "MCM8",
        geneSummary: `MCM8 codes for a protein that plays a crucial role in the process of cell division and DNA replication. MCM8 helps to unwind and open up the DNA strands during cell division, allowing the cellular machinery to read and replicate the genetic instructions accurately. Specific SNPs in the MCM8 gene lead to instability of the DNA during cell division, which can decrease the number of viable eggs produced by the ovaries. This can directly increase the risk of fertility issues and early menopause.`,
        chromosome: 20,
        position_GRCh38: 5967581,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs1799724",
        geneName: "TNF",
        geneSummary: `This gene encodes a multifunctional proinflammatory cytokine that belongs to the tumor necrosis factor (TNF) superfamily. This cytokine is mainly secreted by macrophages. It can bind to, and thus functions through its receptors TNFRSF1A/TNFR1 and TNFRSF1B/TNFBR. This cytokine is involved in the regulation of a wide spectrum of biological processes including cell proliferation, differentiation, apoptosis, lipid metabolism, and coagulation. This cytokine has been implicated in a variety of diseases, including autoimmune diseases, insulin resistance, psoriasis, rheumatoid arthritis ankylosing spondylitis, tuberculosis, autosomal dominant polycystic kidney disease, and cancer. Mutations in this gene affect susceptibility to cerebral malaria, septic shock, and Alzheimer disease. Knockout studies in mice also suggested the neuroprotective function of this cytokine.`,
        chromosome: 6,
        position_GRCh38: 31574705,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs1799752",
        geneName: "ACE",
        geneSummary: `ACE drives the renin–angiotensin–aldosterone system (RAAS) by converting angiotensin I → angiotensin II and breaking down bradykinin, shaping blood pressure, vascular tone, fluid/sodium balance, and downstream recovery capacity. Common variation at rs1799752 (ACE I/D) can shift baseline ACE activity, which in men may influence training blood flow and endurance response, erectile performance/vascular health, and the hormonal milieu indirectly (via sleep quality, blood pressure load, and aldosterone-driven fluid balance that can nudge the HPT axis). Think of it as a circulation & recovery dial: pair aerobic base + resistance training, keep sodium–potassium intake balanced, prioritize sleep (screen for snoring/OSA if hypertensive), stay well-hydrated, and build a nitrate-rich diet (leafy greens/beets) to support nitric oxide and vascular function.`,
        chromosome: 17,
        position_GRCh38: 63488530,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs1799814",
        geneName: "CYP1A1",
        geneSummary: `The CYP1A1 gene codes for a member of the cytochrome P450 family of enzymes, which play a crucial role in how our bodies break down compounds. The CYP1A1 protein, also called aryl hydrocarbon hydroxylase, is also a key enzyme involved in metabolizing estrogens. Variations that can occur in the CYP1A1 gene may influence how this gene works and its ability to break down the bodies bioavailable estrogens, which can impact related menopausal symptoms.`,
        chromosome: 15,
        position_GRCh38: 74720644,
        referenceAllele: "G",
        altAllele: "T"
    },
    {
        rsId: "rs1799941",
        geneName: "SHBG",
        geneSummary: `SHBG is the liver-made carrier that binds testosterone and estradiol, controlling how much is free/bioavailable to tissues. Variation at rs1799941—a regulatory SHBG variant—has been linked to shifts in circulating SHBG levels, which can nudge free T, the T↔E2 balance, and downstream traits like libido, energy, body-fat patterning, and lipid/vascular markers. Real-world impact depends on context (insulin sensitivity, thyroid status, body fat, sleep, alcohol, meds). Treat rs1799941 as a bioavailability dial: prioritize protein + fiber, resistance + aerobic training, consistent sleep, and review medications that interact with hormone transport/clearance`,
        chromosome: 17,
        position_GRCh38: 7630105,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs1799963",
        geneName: "F2",
        geneSummary: `This gene encodes the prothrombin protein (also known as coagulation factor II). This protein is proteolytically cleaved in multiple steps to form the activated serine protease thrombin. The activated thrombin enzyme plays an important role in thrombosis and hemostasis by converting fibrinogen to fibrin during blood clot formation, by stimulating platelet aggregation, and by activating additional coagulation factors. Thrombin also plays a role in cell proliferation, tissue repair, and angiogenesis as well as maintaining vascular integrity during development and postnatal life. Peptides derived from the C-terminus of this protein have antimicrobial activity against E. coli and P. aeruginosa. Mutations in this gene lead to various forms of thrombosis and dysprothrombinemia. Rapid increases in cytokine levels following coronavirus infections can dysregulate the coagulation cascade and produce thrombosis, compromised blood supply, and organ failure.`,
        chromosome: 11,
        position_GRCh38: 46739505,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs1799971",
        geneName: "OPRM1",
        geneSummary: `The OPRM1 gene encodes the mu opioid receptor (MOR), the primary receptor for the body’s endogenous opioids, such as beta-endorphins and enkephalins. This receptor governs how the brain modulates pain, reward, and stress-coping behavior. Through its influence on dopamine signaling, OPRM1 shapes emotional resilience, motivation, and sensitivity to pleasure or reward cues. Variants like rs1799971 (A118G) can affect receptor binding and downstream signaling efficiency, influencing how individuals experience stress relief, reward reinforcement, and recovery after emotional or physical strain. Functionally, OPRM1 sits at the intersection of pain perception, mood regulation, and addictive tendencies, serving as a neurobiological bridge between stress and reward systems.`,
        chromosome: 6,
        position_GRCh38: 154039662,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs1799983",
        geneName: "NOS3",
        geneSummary: `Nitric oxide is a reactive free radical which acts as a biologic mediator in several processes, including neurotransmission and antimicrobial and antitumoral activities. Nitric oxide is synthesized from L-arginine by nitric oxide synthases. Variations in this gene are associated with susceptibility to coronary spasm. Alternative splicing and the use of alternative promoters results in multiple transcript variants.`,
        chromosome: 7,
        position_GRCh38: 150999023,
        referenceAllele: "T",
        altAllele: "G"
    },
    {
        rsId: "rs1799998",
        geneName: "CYP11B2",
        geneSummary: `The CYP11B2 gene encodes aldosterone synthase, a mitochondrial enzyme responsible for the final steps of aldosterone production. This enzyme converts corticosterone to aldosterone, a key hormone that helps regulate blood pressure, electrolyte balance, and fluid volume. Variations in CYP11B2 can influence how efficiently aldosterone is produced and how the body responds to sodium intake, hydration, and physical stress. Functionally, it connects the endocrine, cardiovascular, and metabolic systems—shaping traits like salt sensitivity, exercise recovery, and overall cardiometabolic resilience.`,
        chromosome: 8,
        position_GRCh38: 142918184,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs1800440",
        geneName: "CYP1B1",
        geneSummary: `The CYP1A1 gene codes for a member of the cytochrome P450 family of enzymes, which play 
a crucial role in how our bodies break down compounds. The CYP1A1 protein, also called 
aryl hydrocarbon hydroxylase, is also a key enzyme involved in metabolizing estrogens. 
Variations that can occur in the CYP1A1 gene may influence how this gene works and its ability to 
break down the bodies bioavailable estrogens, which can impact related menopausal symptoms.`,
        chromosome: 2,
        position_GRCh38: 38070996,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs1800497",
        geneName: "DRD2/ANKK1",
        geneSummary: `The protein encoded by this gene belongs to the Ser/Thr protein kinase family, and protein kinase superfamily involved in signal transduction pathways. This gene is closely linked to DRD2 gene (GeneID:1813) on chr 11, and a well studied restriction fragment length polymorphism (RFLP) designated TaqIA, was originally associated with the DRD2 gene, however, later was determined to be located in exon 8 of ANKK1 gene (PMIDs: 18621654, 15146457), where it causes a nonconservative amino acid substitution. It is not clear if this gene plays any role in neuropsychiatric disorders previously associated with Taq1A RFLP.`,
        chromosome: 11,
        position_GRCh38: 113400106,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs1800587",
        geneName: "IL1A",
        geneSummary: `The protein encoded by this gene is a member of the interleukin 1 cytokine family. This cytokine is a pleiotropic cytokine involved in various immune responses, inflammatory processes, and hematopoiesis. This cytokine is produced by monocytes and macrophages as a proprotein, which is proteolytically processed and released in response to cell injury, and thus induces apoptosis. This gene and eight other interleukin 1 family genes form a cytokine gene cluster on chromosome 2. It has been suggested that the polymorphism of these genes is associated with rheumatoid arthritis and Alzheimer's disease.`,
        chromosome: 2,
        position_GRCh38: 112785383,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs1800629",
        geneName: "TNF",
        geneSummary: `This gene encodes a multifunctional proinflammatory cytokine that belongs to the tumor necrosis factor (TNF) superfamily. This cytokine is mainly secreted by macrophages. It can bind to, and thus functions through its receptors TNFRSF1A/TNFR1 and TNFRSF1B/TNFBR. This cytokine is involved in the regulation of a wide spectrum of biological processes including cell proliferation, differentiation, apoptosis, lipid metabolism, and coagulation. This cytokine has been implicated in a variety of diseases, including autoimmune diseases, insulin resistance, psoriasis, rheumatoid arthritis ankylosing spondylitis, tuberculosis, autosomal dominant polycystic kidney disease, and cancer. Mutations in this gene affect susceptibility to cerebral malaria, septic shock, and Alzheimer disease. Knockout studies in mice also suggested the neuroprotective function of this cytokine.`,
        chromosome: 6,
        position_GRCh38: 31575254,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs1800795",
        geneName: "IL6",
        geneSummary: `This gene encodes a cytokine that functions in inflammation and the maturation of B cells. In addition, the encoded protein has been shown to be an endogenous pyrogen capable of inducing fever in people with autoimmune diseases or infections. The protein is primarily produced at sites of acute and chronic inflammation, where it is secreted into the serum and induces a transcriptional inflammatory response through interleukin 6 receptor, alpha. The functioning of this gene is implicated in a wide variety of inflammation-associated disease states, including suspectibility to diabetes mellitus and systemic juvenile rheumatoid arthritis. Elevated levels of the encoded protein have been found in virus infections, including COVID-19 (disease caused by SARS-CoV-2).`,
        chromosome: 7,
        position_GRCh38: 22727026,
        referenceAllele: "C",
        altAllele: "G"
    },
    {
        rsId: "rs1801133",
        geneName: "MTHFR",
        geneSummary: `MTHFR runs a key step in methylation, the process that recycles folate to make neurotransmitters and regulate homocysteine—touching mood, focus, recovery, and vascular tone. Differences at rs1801133 (C677T/Ala222Val) can lower enzyme efficiency, which may influence dopamine/serotonin synthesis, stress resilience, and indirectly nudge the T↔E2 picture via one-carbon metabolism. It’s a tuning knob, not a diagnosis: sleep regularity, stress management, and nutrition that supports methylation (adequate folate/folate forms, B12, B6, riboflavin) typically help, alongside steady training and moderate alcohol.`,
        chromosome: 1,
        position_GRCh38: 11796321,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs1801260",
        geneName: "CLOCK",
        geneSummary: `CLOCK is a master timekeeper for your body’s circadian rhythm—coordinating sleep–wake cycles, metabolism, and daily hormone pulses (including the morning testosterone peak). Variation at rs1801260 (3111T/C) sits in the gene’s 3′ region and can modestly shift circadian timing preferences and sleep quality, which in turn can nudge morning alertness, training recovery, and T↔E2 rhythm. In practice, men with more evening-leaning CLOCK settings often benefit from stronger zeitgebers: bright morning light, consistent sleep/wake windows, daytime activity, and low-light wind-downs before bed`,
        chromosome: 4,
        position_GRCh38: 55435202,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs1803274",
        geneName: "BCHE",
        geneSummary: `This gene encodes a cholinesterase enzyme and member of the type-B carboxylesterase/lipase family of proteins. The encoded enzyme exhibits broad substrate specificity and is involved in the detoxification of poisons including organophosphate nerve agents and pesticides, and the metabolism of drugs including cocaine, heroin and aspirin. Humans homozygous for certain mutations in this gene exhibit prolonged apnea after administration of the muscle relaxant succinylcholine.`,
        chromosome: 3,
        position_GRCh38: 165773492,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs1815739",
        geneName: "ACTN3",
        geneSummary: `This gene encodes a member of the alpha-actin binding protein gene family. The encoded protein is primarily expressed in skeletal muscle and functions as a structural component of sarcomeric Z line. This protein is involved in crosslinking actin containing thin filaments. An allelic polymorphism in this gene results in both coding and non-coding variants; the reference genome represents the coding allele. The non-functional allele of this gene is associated with elite athlete status.`,
        chromosome: 11,
        position_GRCh38: 66560624,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs1819698",
        geneName: "HSD3B2",
        geneSummary: `The protein encoded by this gene is a bifunctional enzyme that catalyzes the oxidative conversion of delta(5)-ene-3-beta-hydroxy steroid, and the oxidative conversion of ketosteroids. It plays a crucial role in the biosynthesis of all classes of hormonal steroids. This gene is predominantly expressed in the adrenals and the gonads. Mutations in this gene are associated with 3-beta-hydroxysteroid dehydrogenase, type II, deficiency. Alternatively spliced transcript variants have been found for this gene.`,
        chromosome: 1,
        position_GRCh38: 119422896,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs182420",
        geneName: "SULT2A1",
        geneSummary: `SULT2A1 is a Phase II sulfotransferase that tags steroids—especially DHEA/DHEA-S and other androgen/estrogen metabolites—with sulfate so they become water-soluble for clearance. Variation at rs296361 can modestly shift enzyme activity, influencing circulating DHEA-S, downstream free T/E2 balance, and how you respond to training, stress, and calorie swings. In real life, men with less efficient sulfation may retain more unconjugated steroid metabolites (or drugs/bile acids handled by SULT2A1), nudging libido, mood/energy, body-fat patterning, and lipid/vascular markers. Practical levers that support this pathway: adequate protein, magnesium + B-vitamins (methylation/sulfur pathways), fiber, resistance + aerobic training, steady sleep, and moderate alcohol.`,
        chromosome: 19,
        position_GRCh38: 47868938,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs1927907",
        geneName: "TLR4",
        geneSummary: `The protein encoded by this gene is a member of the Toll-like receptor (TLR) family which plays a fundamental role in pathogen recognition and activation of innate immunity. TLRs are highly conserved from Drosophila to humans and share structural and functional similarities. They recognize pathogen-associated molecular patterns that are expressed on infectious agents, and mediate the production of cytokines necessary for the development of effective immunity. The various TLRs exhibit different patterns of expression. In silico studies have found a particularly strong binding of surface TLR4 with the spike protein of severe acute respiratory syndrome coronavirus 2 (SARS-CoV-2), the causative agent of Coronavirus disease-2019 (COVID-19). This receptor has also been implicated in signal transduction events induced by lipopolysaccharide (LPS) found in most gram-negative bacteria. Mutations in this gene have been associated with differences in LPS responsiveness, and with susceptibility to age-related macular degeneration. Multiple transcript variants encoding different isoforms have been found for this gene.`,
        chromosome: 9,
        position_GRCh38: 117710486,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs2015062",
        geneName: "COX1",
        geneSummary: `MT-CO1 encodes a core subunit of cytochrome c oxidase (Complex IV) in the mitochondrial respiratory chain—the last step of oxidative phosphorylation that drives ATP production. The variant rs2015062 (m.7028C>T) is a synonymous change in MT-CO1; it doesn’t alter the amino acid sequence and is widely regarded as benign, showing up frequently across global mitochondrial lineages (it’s even used as a marker in haplogrouping). Functionally, it’s best viewed as an ancestry-informative polymorphism rather than a disease variant.`,
        chromosome: 0,
        position_GRCh38: 7028,
        referenceAllele: "C",
        altAllele: "T,G*"
    },
    {
        rsId: "rs2030324",
        geneName: "BDNF",
        geneSummary: `This gene encodes a member of the nerve growth factor family of proteins. Alternative splicing results in multiple transcript variants, at least one of which encodes a preproprotein that is proteolytically processed to generate the mature protein. Binding of this protein to its cognate receptor promotes neuronal survival in the adult brain. Expression of this gene is reduced in Alzheimer's, Parkinson's, and Huntington's disease patients. This gene may play a role in the regulation of the stress response and in the biology of mood disorders.`,
        chromosome: 11,
        position_GRCh38: 27705368,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs20417",
        geneName: "PTGS2",
        geneSummary: `Prostaglandin-endoperoxide synthase (PTGS), also known as cyclooxygenase, is the key enzyme in prostaglandin biosynthesis, and acts both as a dioxygenase and as a peroxidase. There are two isozymes of PTGS: a constitutive PTGS1 and an inducible PTGS2, which differ in their regulation of expression and tissue distribution. This gene encodes the inducible isozyme. It is regulated by specific stimulatory events, suggesting that it is responsible for the prostanoid biosynthesis involved in inflammation and mitogenesis.`,
        chromosome: 1,
        position_GRCh38: 186681189,
        referenceAllele: "C",
        altAllele: "G"
    },
    {
        rsId: "rs2049045",
        geneName: "BDNF",
        geneSummary: `This gene encodes a member of the nerve growth factor family of proteins. Alternative splicing results in multiple transcript variants, at least one of which encodes a preproprotein that is proteolytically processed to generate the mature protein. Binding of this protein to its cognate receptor promotes neuronal survival in the adult brain. Expression of this gene is reduced in Alzheimer's, Parkinson's, and Huntington's disease patients. This gene may play a role in the regulation of the stress response and in the biology of mood disorders.`,
        chromosome: 11,
        position_GRCh38: 27672694,
        referenceAllele: "G",
        altAllele: "C"
    },
    {
        rsId: "rs2075650",
        geneName: "TOMM40",
        geneSummary: `The protein encoded by this gene is localized in the outer membrane of the mitochondria. It is the channel-forming subunit of the translocase of the mitochondrial outer membrane (TOM) complex that is essential for import of protein precursors into mitochondria. Alternatively spliced transcript variants have been found for this gene.`,
        chromosome: 19,
        position_GRCh38: 44892362,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs2107595",
        geneName: "HDAC9",
        geneSummary: `Histones play a critical role in transcriptional regulation, cell cycle progression, and developmental events. Histone acetylation/deacetylation alters chromosome structure and affects transcription factor access to DNA. The protein encoded by this gene has sequence homology to members of the histone deacetylase family. This gene is orthologous to the Xenopus and mouse MITR genes. The MITR protein lacks the histone deacetylase catalytic domain. It represses MEF2 activity through recruitment of multicomponent corepressor complexes that include CtBP and HDACs. This encoded protein may play a role in hematopoiesis. Multiple alternatively spliced transcripts have been described for this gene but the full-length nature of some of them has not been determined.`,
        chromosome: 7,
        position_GRCh38: 19009765,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs2230288 (E326K)",
        geneName: "GBA",
        geneSummary: `This gene encodes a lysosomal membrane protein that cleaves the beta-glucosidic linkage of glycosylceramide, an intermediate in glycolipid metabolism. Mutations in this gene cause Gaucher disease, a lysosomal storage disease characterized by an accumulation of glucocerebrosides. A related pseudogene is approximately 12 kb downstream of this gene on chromosome 1. Alternative splicing results in multiple transcript variants.`,
        chromosome: 1,
        position_GRCh38: 155236376,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs2230500",
        geneName: "PRKCH",
        geneSummary: `Protein kinase C (PKC) is a family of serine- and threonine-specific protein kinases that can be activated by calcium and the second messenger diacylglycerol. PKC family members phosphorylate a wide variety of protein targets and are known to be involved in diverse cellular signaling pathways. PKC family members also serve as major receptors for phorbol esters, a class of tumor promoters. Each member of the PKC family has a specific expression profile and is believed to play a distinct role in cells. The protein encoded by this gene is one of the PKC family members. It is a calcium-independent and phospholipids-dependent protein kinase. It is predominantly expressed in epithelial tissues and has been shown to reside specifically in the cell nucleus. This protein kinase can regulate keratinocyte differentiation by activating the MAP kinase MAPK13 (p38delta)-activated protein kinase cascade that targets CCAAT/enhancer-binding protein alpha (CEBPA). It is also found to mediate the transcription activation of the transglutaminase 1 (TGM1) gene. Mutations in this gene are associated with susceptibility to cerebral infarction`,
        chromosome: 14,
        position_GRCh38: 61457521,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs2234693",
        geneName: "ESR1",
        geneSummary: `ESR1 codes for the Estrogen Receptor α protein, a protein in your body that responds to the hormone estrogen. When estrogen binds to this receptor, it impacts the expression of other genes to help regulate processes like growth, development, bone health, and the menstrual cycle. Changes in the ESR1 gene can affect how your body responds to the drops in estrogen that occur during menopause, potentially linking to certain menopausal symptoms.`,
        chromosome: 6,
        position_GRCh38: 151842200,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs225014",
        geneName: "DIO2",
        geneSummary: `The protein encoded by this gene belongs to the iodothyronine deiodinase family. It catalyzes the conversion of prohormone thyroxine (3,5,3',5'-tetraiodothyronine, T4) to the bioactive thyroid hormone (3,5,3'-triiodothyronine, T3) by outer ring 5'-deiodination. This gene is widely expressed, including in thyroid and brain. It is thought to be responsible for the 'local' production of T3, and thus important in influencing thyroid hormone action in these tissues. It has also been reported to be highly expressed in thyroids of patients with Graves disease, and in follicular adenomas. The intrathyroidal T4 to T3 conversion by this enzyme may contribute significantly to the relative increase in thyroidal T3 production in these patients.`,
        chromosome: 14,
        position_GRCh38: 80203237,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs2267735",
        geneName: "ADCYAP1R1",
        geneSummary: `The ADCYAP1R1 gene encodes the PAC1 receptor, a membrane-bound protein that mediates the actions of PACAP, a neuropeptide deeply involved in the brain’s adaptive stress responses. By activating adenylate cyclase and modulating cAMP signaling, PAC1 regulates neural plasticity, emotional learning, and autonomic balance. Variants in this gene have been linked to stress reactivity, anxiety sensitivity, and post-traumatic stress vulnerability, particularly in how individuals process threat and recover after trauma. Functionally, ADCYAP1R1 helps calibrate the neuroendocrine stress response, bridging hormonal signaling and brain circuit plasticity to influence long-term resilience.`,
        chromosome: 7,
        position_GRCh38: 31095890,
        referenceAllele: "C",
        altAllele: "G"
    },
    {
        rsId: "rs2268458",
        geneName: "TSHR",
        geneSummary: `The protein encoded by this gene is a membrane protein and a major controller of thyroid cell metabolism. The encoded protein is a receptor for thyrothropin and thyrostimulin, and its activity is mediated by adenylate cyclase. Defects in this gene are a cause of several types of hyperthyroidism. Three transcript variants encoding different isoforms have been found for this gene.`,
        chromosome: 14,
        position_GRCh38: 80996551,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs2278749",
        geneName: "ARNTL(BMAL1)",
        geneSummary: `ARNTL is a master clock gene that sets daily timing signals for the brain and body—governing sleep quality, mood stability, stress reactivity, attention, and daytime energy. Variation at rs2278749 can subtly shift BMAL1’s regulation of the circadian system, which in turn can influence insomnia risk/fragmented sleep, chronotype (night-owl vs early-bird), and downstream mental-health outcomes tied to sleep (e.g., anxiety/depressive symptoms, irritability, cognitive performance). In short: this SNP acts like a timing/sleep-quality sensitivity dial; strengthening circadian anchors—bright morning light, regular sleep–wake windows, daytime activity, and a low-light wind-down—helps buffer mood and cognitive effects.`,
        chromosome: 11,
        position_GRCh38: 13376331,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs2292596",
        geneName: "AHRR",
        geneSummary: `The aryl hydrocarbon receptor (ARH) is a protein that, when activated, can turn certain genes on or off in response to our internal bodily environment. It plays a crucial role in our body's response to various chemicals by increasing expression of genes for proteins, such as the cytochrome P450 family of enzymes, that break down circulating molecules. Expression of the ARH is highly regulated by your cells, and variations in the regulatory regions of your genetic code, such as the gene coding for the ARH-repressor (AHRR) protein, can influence the rate at which our body's can break down specific substances, including hormones. This can be particularly significant during menopause, when circulating hormone levels are already subject to fluctuation. SNPs in the AHRR region that impact genes associated with our body’s molecule breakdown pathways have been shown to impact the concentration of compounds associated with specific symptoms of menopause, and can thereby impact your genetic predisposition.`,
        chromosome: 5,
        position_GRCh38: 422840,
        referenceAllele: "C",
        altAllele: "G"
    },
    {
        rsId: "rs2295633",
        geneName: "FAAH",
        geneSummary: "This gene encodes a protein that is responsible for the hydrolysis of a number of primary and secondary fatty acid amides, including the neuromodulatory compounds anandamide and oleamide.",
        chromosome: 1,
        position_GRCh38: 46408711,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs2300478",
        geneName: "MEIS1",
        geneSummary: `Homeobox genes, of which the most well-characterized category is represented by the HOX genes, play a crucial role in normal development. In addition, several homeoproteins are involved in neoplasia. This gene encodes a homeobox protein belonging to the TALE ('three amino acid loop extension') family of homeodomain-containing proteins.`,
        chromosome: 2,
        position_GRCh38: 66554321,
        referenceAllele: "T",
        altAllele: "G"
    },
    {
        rsId: "rs2305160",
        geneName: "NPAS2",
        geneSummary: `The protein encoded by this gene is a member of the basic helix-loop-helix (bHLH)-PAS family of transcription factors. A similar mouse protein may play a regulatory role in the acquisition of specific types of memory. It also may function as a part of a molecular clock operative in the mammalian forebrain.`,
        chromosome: 2,
        position_GRCh38: 100974842,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs2384687",
        geneName: "TMEM150B",
        geneSummary: `Helps cells recycle and survive during low-energy or stress states by tuning autophagy. Variants at rs2384687 may shift that stress-handling set point in hormone tissues (testes) and along the HPT axis, subtly influencing testosterone rhythm, recovery from training, and overall metabolic resilience. Action levers: regular sleep, consistent protein and resistance training, smart glycemic control, and avoiding chronic crash diets.`,
        chromosome: 19,
        position_GRCh38: 55319820,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs242557",
        geneName: "MAPT",
        geneSummary: `This gene encodes the microtubule-associated protein tau (MAPT) whose transcript undergoes complex, regulated alternative splicing, giving rise to several mRNA species. MAPT transcripts are differentially expressed in the nervous system, depending on stage of neuronal maturation and neuron type. MAPT gene mutations have been associated with several neurodegenerative disorders such as Alzheimer's disease, Pick's disease, frontotemporal dementia, cortico-basal degeneration and progressive supranuclear palsy.`,
        chromosome: 17,
        position_GRCh38: 45942346,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs242924",
        geneName: "CRHR1",
        geneSummary: `This gene encodes a G-protein coupled receptor that binds neuropeptides of the corticotropin releasing hormone family that are major regulators of the hypothalamic-pituitary-adrenal pathway. The encoded protein is essential for the activation of signal transduction pathways that regulate diverse physiological processes including stress, reproduction, immune response and obesity. Alternative splicing results in multiple transcript variants. Naturally-occurring readthrough transcription between this gene and upstream GeneID:147081 results in transcripts that encode isoforms that share similarity with the products of this gene.`,
        chromosome: 17,
        position_GRCh38: 45808001,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs2471738",
        geneName: "MAPT",
        geneSummary: `This gene encodes the microtubule-associated protein tau (MAPT) whose transcript undergoes complex, regulated alternative splicing, giving rise to several mRNA species. MAPT transcripts are differentially expressed in the nervous system, depending on stage of neuronal maturation and neuron type. MAPT gene mutations have been associated with several neurodegenerative disorders such as Alzheimer's disease, Pick's disease, frontotemporal dementia, cortico-basal degeneration and progressive supranuclear palsy.`,
        chromosome: 17,
        position_GRCh38: 45998697,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs2501432",
        geneName: "CNR2",
        geneSummary: `CNR2 encodes the annabinoid type 2 (CB2) receptor. CNR2 is expressed in immune tissues and is also present in the mammalian brain, highlighting its role in central nervous system activity. Research has linked CNR2 function to behaviors such as alcohol use, mood regulation, and stress-related responses. Several polymorphisms in this gene have been associated with pain sensitivity, immune processes, and depressive symptoms in humans. These findings suggest that variation in CNR2 may influence susceptibility to mood disorders and could represent a potential target for future therapeutic approaches.`,
        chromosome: 1,
        position_GRCh38: 23875430,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs2606345",
        geneName: "CYP1A1",
        geneSummary: `This gene, CYP1A1, encodes a member of the cytochrome P450 superfamily of enzymes. The cytochrome P450 proteins are monooxygenases which catalyze many reactions involved in drug metabolism and synthesis of cholesterol, steroids and other lipids. This protein localizes to the endoplasmic reticulum and its expression is induced by some polycyclic aromatic hydrocarbons (PAHs), some of which are found in cigarette smoke. The enzyme's endogenous substrate is unknown; however, it is able to metabolize some PAHs to carcinogenic intermediates. The gene has been associated with lung cancer risk. A related family member, CYP1A2, is located approximately 25 kb away from CYP1A1 on chromosome 15. Alternative splicing results in multiple transcript variants encoding distinct isoforms.`,
        chromosome: 15,
        position_GRCh38: 74724835,
        referenceAllele: "C",
        altAllele: "A"
    },
    {
        rsId: "rs2609997",
        geneName: "PENK",
        geneSummary: `This gene encodes a preproprotein that is proteolytically processed to generate multiple protein products. These products include the pentapeptide opioids Met-enkephalin and Leu-enkephalin, which are stored in synaptic vesicles, then released into the synapse where they bind to mu- and delta-opioid receptors to modulate the perception of pain. Other non-opioid cleavage products may function in distinct biological activities.`,
        chromosome: 8,
        position_GRCh38: 56447926,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs2740574",
        geneName: "CYP3A4",
        geneSummary: `CYP3A4 is a major Phase I enzyme that helps your liver clear steroids (including estrogens) and ~50% of common medications. The rs2740574 promoter variant can modestly shift CYP3A4 expression, which may change how quickly you process hormones, supplements, and drugs—nudging bioavailable E2/T balance, recovery, and side-effect profiles. In practice, men with lower CYP3A4 activity may experience stronger or longer drug effects (and slower steroid clearance), while higher activity can do the opposite; induction by certain meds, alcohol patterns, or phytochemicals adds another layer. For stable hormone health, pair medication review (CYP3A4 substrates/inhibitors/inducers) with basics that support hepatic metabolism: consistent sleep, resistance + aerobic training, protein + fiber, and moderate alcohol.`,
        chromosome: 7,
        position_GRCh38: 99784473,
        referenceAllele: "C",
        altAllele: "A,G,T"
    },
    {
        rsId: "rs2770304",
        geneName: "HTR2A",
        geneSummary: `This gene encodes one of the receptors for serotonin, a neurotransmitter with many roles. Mutations in this gene are associated with susceptibility to schizophrenia and obsessive-compulsive disorder, and are also associated with response to the antidepressant citalopram in patients with major depressive disorder (MDD). MDD patients who also have a mutation in intron 2 of this gene show a significantly reduced response to citalopram as this antidepressant downregulates expression of this gene. Multiple transcript variants encoding different isoforms have been found for this gene.`,
        chromosome: 13,
        position_GRCh38: 46881230,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs28374627",
        geneName: "UGT2B17",
        geneSummary: `This gene encodes a member of the uridine diphosphoglucuronosyltransferase protein family. The encoded enzyme catalyzes the transfer of glucuronic acid from uridine diphosphoglucuronic acid to a diverse array of substrates including steroid hormones and lipid-soluble drugs. This process, known as glucuronidation, is an intermediate step in the metabolism of steroids. Copy number variation in this gene is associated with susceptibility to osteoporosis.`,
        chromosome: 4,
        position_GRCh38: 68551852,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs296361",
        geneName: "SULT2A1",
        geneSummary: `SULT2A1 is a Phase II sulfotransferase that tags steroids—especially DHEA/DHEA-S and other androgen/estrogen metabolites—with sulfate so they become water-soluble for clearance. Variation at rs296361 can modestly shift enzyme activity, influencing circulating DHEA-S, downstream free T/E2 balance, and how you respond to training, stress, and calorie swings. In real life, men with less efficient sulfation may retain more unconjugated steroid metabolites (or drugs/bile acids handled by SULT2A1), nudging libido, mood/energy, body-fat patterning, and lipid/vascular markers. Practical levers that support this pathway: adequate protein, magnesium + B-vitamins (methylation/sulfur pathways), fiber, resistance + aerobic training, steady sleep, and moderate alcohol.`,
        chromosome: 19,
        position_GRCh38: 47886106,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs324420",
        geneName: "FAAH",
        geneSummary: `FAAH breaks down endocannabinoids like anandamide, which help regulate stress reactivity, mood, pain, sleep, and reward. The rs324420 missense change (Pro129Thr) makes FAAH more prone to degradation, often leading to higher anandamide tone, which has been linked—in mixed literature—to differences in anxiety traits, stress recovery, substance-use vulnerability, pain tolerance, and nausea. Treat it as a tuning knob, not destiny; sleep regularity, exercise, and nutrition meaningfully modulate this pathway.`,
        chromosome: 1,
        position_GRCh38: 46405089,
        referenceAllele: "C",
        altAllele: "A"
    },
    {
        rsId: "rs35767",
        geneName: "IGF1",
        geneSummary: `The protein encoded by this gene is similar to insulin in function and structure and is a member of a family of proteins involved in mediating growth and development. The encoded protein is processed from a precursor, bound by a specific receptor, and secreted. Defects in this gene are a cause of insulin-like growth factor I deficiency. Alternative splicing results in multiple transcript variants encoding different isoforms that may undergo similar processing to generate mature protein.`,
        chromosome: 12,
        position_GRCh38: 102481791,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs3751592",
        geneName: "CYP19A1",
        geneSummary: `This gene encodes a member of the cytochrome P450 superfamily of enzymes. The cytochrome P450 proteins are monooxygenases which catalyze many reactions involved in drug metabolism and synthesis of cholesterol, steroids and other lipids. This protein localizes to the endoplasmic reticulum and catalyzes the last steps of estrogen biosynthesis. Mutations in this gene can result in either increased or decreased aromatase activity; the associated phenotypes suggest that estrogen functions both as a sex steroid hormone and in growth or differentiation. Alternative promoter use and alternative splicing results in multiple transcript variants that have different tissue specificities.`,
        chromosome: 15,
        position_GRCh38: 51314381,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs3764650",
        geneName: "ABCA7",
        geneSummary: `The protein encoded by this gene is a member of the superfamily of ATP-binding cassette (ABC) transporters. ABC proteins transport various molecules across extra- and intra-cellular membranes. ABC genes are divided into seven distinct subfamilies (ABC1, MDR/TAP, MRP, ALD, OABP, GCN20, White). This protein is a member of the ABC1 subfamily. Members of the ABC1 subfamily comprise the only major ABC subfamily found exclusively in multicellular eukaryotes. This full transporter has been detected predominantly in myelo-lymphatic tissues with the highest expression in peripheral leukocytes, thymus, spleen, and bone marrow. The function of this protein is not yet known; however, the expression pattern suggests a role in lipid homeostasis in cells of the immune system`,
        chromosome: 19,
        position_GRCh38: 1046521,
        referenceAllele: "T",
        altAllele: "G"
    },
    {
        rsId: "rs3781834",
        geneName: "SORL1",
        geneSummary: `This gene encodes a mosaic protein that belongs to at least two families: the vacuolar protein sorting 10 (VPS10) domain-containing receptor family, and the low density lipoprotein receptor (LDLR) family. The encoded protein also contains fibronectin type III repeats and an epidermal growth factor repeat. The encoded preproprotein is proteolytically processed to generate the mature receptor, which likely plays roles in endocytosis and sorting. Mutations in this gene may be associated with Alzheimer's disease`,
        chromosome: 11,
        position_GRCh38: 121575231,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs3800373",
        geneName: "FKBP5",
        geneSummary: `FKBP5 is a co-chaperone that tunes glucocorticoid receptor (cortisol) sensitivity. The rs1360780 setting can shift how quickly the body shuts off a stress response (negative feedback), effectively changing your cortisol “gain.” In men, that tuning can influence sleep quality, morning alertness and testosterone rhythm, abdominal fat tendency, mood/irritability, and training recovery—because prolonged or higher cortisol pulses transiently dampen testosterone and blunt anabolism. Think of this SNP as a stress-response dial, not a diagnosis. Helpful levers: consistent sleep/wake timing, strong morning light, a base of zone-2 + resistance training, protein + fiber with moderated alcohol, and nightly wind-down (low light, breath work) to keep cortisol—and thus hormones—on a healthy rhythm.`,
        chromosome: 6,
        position_GRCh38: 35574699,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs3824755",
        geneName: "CYP17A1",
        geneSummary: `This gene encodes a member of the cytochrome P450 superfamily of enzymes. The cytochrome P450 proteins are monooxygenases which catalyze many reactions involved in drug metabolism and synthesis of cholesterol, steroids and other lipids. This protein localizes to the endoplasmic reticulum. It has both 17alpha-hydroxylase and 17,20-lyase activities and is a key enzyme in the steroidogenic pathway that produces progestins, mineralocorticoids, glucocorticoids, androgens, and estrogens. Mutations in this gene are associated with isolated steroid-17 alpha-hydroxylase deficiency, 17-alpha-hydroxylase/17,20-lyase deficiency, pseudohermaphroditism, and adrenal hyperplasia.`,
        chromosome: 10,
        position_GRCh38: 102836092,
        referenceAllele: "G",
        altAllele: "C"
    },
    {
        rsId: "rs3851179",
        geneName: "PICALM",
        geneSummary: `This gene encodes a clathrin assembly protein, which recruits clathrin and adaptor protein complex 2 (AP2) to cell membranes at sites of coated-pit formation and clathrin-vesicle assembly. The protein may be required to determine the amount of membrane to be recycled, possibly by regulating the size of the clathrin cage. The protein is involved in AP2-dependent clathrin-mediated endocytosis at the neuromuscular junction. A chromosomal translocation t(10;11)(p13;q14) leading to the fusion of this gene and the MLLT10 gene is found in acute lymphoblastic leukemia, acute myeloid leukemia and malignant lymphomas. The polymorphisms of this gene are associated with the risk of Alzheimer disease. Multiple alternatively spliced transcript variants encoding different isoforms have been found for this gene.`,
        chromosome: 11,
        position_GRCh38: 86157598,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs3918242",
        geneName: "MMP9",
        geneSummary: `Proteins of the matrix metalloproteinase (MMP) family are involved in the breakdown of extracellular matrix in normal physiological processes, such as embryonic development, reproduction, and tissue remodeling, as well as in disease processes, such as arthritis and metastasis. Most MMP's are secreted as inactive proproteins which are activated when cleaved by extracellular proteinases. The enzyme encoded by this gene degrades type IV and V collagens. Studies in rhesus monkeys suggest that the enzyme is involved in IL-8-induced mobilization of hematopoietic progenitor cells from bone marrow, and murine studies suggest a role in tumor-associated tissue remodeling.`,
        chromosome: 20,
        position_GRCh38: 46007337,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs41423247",
        geneName: "NR3C1",
        geneSummary: `NR3C1 encodes the glucocorticoid (cortisol) receptor—the master control for how strongly your body responds to stress. The rs41423247 variant (commonly called BclI) is linked to differences in cortisol sensitivity, which can shift the “gain” on stress signals and, downstream, influence inflammation, sleep quality, energy use, and the HPT axis (since higher/longer cortisol pulses can transiently dampen testosterone production). In real life, men with a more sensitive setting may notice greater stress-related sleep fragmentation, easier abdominal fat gain, or slower training recovery under high load; a less sensitive setting may blunt stress responses but reduce morning get-up-and-go. Treat this SNP as a stress-response dial: anchor consistent sleep/wake, use morning outdoor light, build an aerobic base + regular resistance training, keep protein + fiber steady, moderate alcohol, and add nightly wind-down (low light, breath work) to keep cortisol—and testosterone, on a healthy rhythm.`,
        chromosome: 5,
        position_GRCh38: 143399010,
        referenceAllele: "G",
        altAllele: "C"
    },
    {
        rsId: "rs41423247 (BclI)",
        geneName: "NR3C1",
        geneSummary: `This gene encodes glucocorticoid receptor, which can function both as a transcription factor that binds to glucocorticoid response elements in the promoters of glucocorticoid responsive genes to activate their transcription, and as a regulator of other transcription factors. This receptor is typically found in the cytoplasm, but upon ligand binding, is transported into the nucleus. It is involved in inflammatory responses, cellular proliferation, and differentiation in target tissues. Mutations in this gene are associated with generalized glucocorticoid resistance. Alternative splicing of this gene results in transcript variants encoding either the same or different isoforms. Additional isoforms resulting from the use of alternate in-frame translation initiation sites have also been described, and shown to be functional, displaying diverse cytoplasm-to-nucleus trafficking patterns and distinct transcriptional activities`,
        chromosome: 5,
        position_GRCh38: 143399010,
        referenceAllele: "G",
        altAllele: "C"
    },
    {
        rsId: "rs4149056",
        geneName: "SLCO1B1",
        geneSummary: `SLCO1B1 (OATP1B1) is a liver uptake transporter that pulls hormones and many other compounds from your bloodstream into liver cells so they can be metabolized and cleared. That includes steroid conjugates (e.g., estradiol/testosterone glucuronides and sulfates), certain bile acids, and a long list of medications. The rs4149056 (c.521T>C; Val174Ala) variant can reduce transporter activity, which may leave more steroid hormones (or their conjugates) in circulation and subtly increase bioavailable T or E2 depending on context. In men, that can show up as shifts in lipids/vascular markers, body-fat patterning, libido, mood, and training recovery, especially when combined with factors like alcohol, calorie surplus/deficit, or high medication load.`,
        chromosome: 12,
        position_GRCh38: 21178615,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs429358",
        geneName: "APOE",
        geneSummary: `The protein encoded by this gene is a major apoprotein of the chylomicron. It binds to a specific liver and peripheral cell receptor, and is essential for the normal catabolism of triglyceride-rich lipoprotein constituents. This gene maps to chromosome 19 in a cluster with the related apolipoprotein C1 and C2 genes. Mutations in this gene result in familial dysbetalipoproteinemia, or type III hyperlipoproteinemia (HLP III), in which increased plasma cholesterol and triglycerides are the consequence of impaired clearance of chylomicron and VLDL remnants.`,
        chromosome: 19,
        position_GRCh38: 44908684,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs4471613",
        geneName: "AQP9",
        geneSummary: `The aquaporins are a family of water-selective membrane channels. This gene encodes a member of a subset of aquaporins called the aquaglyceroporins. This protein allows passage of a broad range of noncharged solutes and also stimulates urea transport and osmotic water permeability. This protein may also facilitate the uptake of glycerol in hepatic tissue . The encoded protein may also play a role in specialized leukocyte functions such as immunological response and bactericidal activity. Alternate splicing results in multiple transcript variants.`,
        chromosome: 15,
        position_GRCh38: 58259495,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs4644",
        geneName: "LGALS3",
        geneSummary: `This gene encodes a member of the galectin family of carbohydrate binding proteins. Members of this protein family have an affinity for beta-galactosides. The encoded protein is characterized by an N-terminal proline-rich tandem repeat domain and a single C-terminal carbohydrate recognition domain. This protein can self-associate through the N-terminal domain allowing it to bind to multivalent saccharide ligands. This protein localizes to the extracellular matrix, the cytoplasm and the nucleus. This protein plays a role in numerous cellular functions including apoptosis, innate immunity, cell adhesion and T-cell regulation. The protein exhibits antimicrobial activity against bacteria and fungi. Alternate splicing results in multiple transcript variants.`,
        chromosome: 14,
        position_GRCh38: 55138217,
        referenceAllele: "C",
        altAllele: "A"
    },
    {
        rsId: "rs4680",
        geneName: "COMT",
        geneSummary: `Catechol-O-methyltransferase (COMT) is an enzyme that plays a crucial role in breaking down certain neurotransmitters, such as dopamine, norepinephrine, and epinephrine. These chemicals are like messengers that influence our mood, focus, and response to stress. Neurotransmitters need to remain in constant balance, or homeostasis, and COMT maintains that balance is by breaking down these chemical signals after they’ve done their job. Some SNPs in the COMT gene are associated with the enzyme being too good at its job and breaking down the neurotransmitters at a rate that can compromise the balance necessary for normal brain functioning. This is how the COMT gene got its association as the “warrior or worrier” gene, with specific SNPs associated with aggression (warrior) and others with anxiety and depression (worrier). COMT also plays a huge role in memory consolidation and retrieval, and has shown specific sex differences with memory processing. Although genes are only part of the picture and environment also plays a huge role in the development of emotional patterns, changes to hormone levels seen during menopause can exacerbate the effect of these SNPs, leading to the emergence or worsening of mood symptoms.`,
        chromosome: 22,
        position_GRCh38: 19963748,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs523349",
        geneName: "SRD5A2",
        geneSummary: `SRD5A2 encodes 5-alpha-reductase type 2, the enzyme that converts testosterone → dihydrotestosterone (DHT) in androgen-sensitive tissues (prostate, skin, genital tract). The rs523349 variant (V89L) is a common coding change that can modulate enzyme efficiency and thus local DHT tone, with downstream effects on prostate physiology, hair/skin androgen responses, libido, and training/recovery context. Clinically, SRD5A2 is the target of finasteride; genotype-driven shifts in baseline activity help explain inter-individual differences in androgen outcomes.`,
        chromosome: 2,
        position_GRCh38: 31580636,
        referenceAllele: "G",
        altAllele: "A, C, T"
    },
    {
        rsId: "rs5301",
        geneName: "CYP11B1",
        geneSummary: `Regulates the final step of cortisol synthesis. The T allele may reduce enzyme efficiency, shifting the cortisol:DHEA balance toward cortisol dominance. In women, this can impact stress resilience, mood, and hormone balance, especially during menopause or adrenal fatigue.`,
        chromosome: 8,
        position_GRCh38: 142868451,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs5479",
        geneName: "HSD11B2",
        geneSummary: `There are at least two isozymes of the corticosteroid 11-beta-dehydrogenase, a microsomal enzyme complex responsible for the interconversion of cortisol and cortisone. The type I isozyme has both 11-beta-dehydrogenase (cortisol to cortisone) and 11-oxoreductase (cortisone to cortisol) activities. The type II isozyme, encoded by this gene, has only 11-beta-dehydrogenase activity. In aldosterone-selective epithelial tissues such as the kidney, the type II isozyme catalyzes the glucocorticoid cortisol to the inactive metabolite cortisone, thus preventing illicit activation of the mineralocorticoid receptor. In tissues that do not express the mineralocorticoid receptor, such as the placenta and testis, it protects cells from the growth-inhibiting and/or pro-apoptotic effects of cortisol, particularly during embryonic development. Mutations in this gene cause the syndrome of apparent mineralocorticoid excess and hypertension.`,
        chromosome: 16,
        position_GRCh38: 67435830,
        referenceAllele: "C",
        altAllele: "A"
    },
    {
        rsId: "rs556621",
        geneName: "CDC5L",
        geneSummary: `The protein encoded by this gene shares a significant similarity with Schizosaccharomyces pombe cdc5 gene product, which is a cell cycle regulator important for G2/M transition. This protein has been demonstrated to act as a positive regulator of cell cycle G2/M progression. It was also found to be an essential component of a non-snRNA spliceosome, which contains at least five additional protein factors and is required for the second catalytic step of pre-mRNA splicing.`,
        chromosome: 6,
        position_GRCh38: 44626422,
        referenceAllele: "T",
        altAllele: "G"
    },
    {
        rsId: "rs56149945",
        geneName: "NR3C1",
        geneSummary: `NR3C1 encodes the glucocorticoid (cortisol) receptor, the master switch for how your brain and tissues respond to stress. Small differences at rs6195 can tilt cortisol sensitivity, changing the “gain” on stress signaling and downstream effects on inflammation, energy use, mood/sleep, and the HPT axis (since higher or more prolonged cortisol can transiently dampen testosterone production). In real life, this shows up as variability in sleep quality, morning alertness, recovery from training, abdominal fat tendency, and motivation under pressure. Treat it as a stress-response dial: anchor regular sleep/wake, build a base of aerobic + resistance training, use daytime light exposure, prioritize protein and fiber with steady carbs (especially around training), and add stress brakes (breath work, mindfulness, evening low-light) to keep cortisol, and thus testosterone, on a healthy rhythm.`,
        chromosome: 5,
        position_GRCh38: 143399752,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs56164415",
        geneName: "BDNF",
        geneSummary: `This gene encodes a member of the nerve growth factor family of proteins. Alternative splicing results in multiple transcript variants, at least one of which encodes a preproprotein that is proteolytically processed to generate the mature protein. Binding of this protein to its cognate receptor promotes neuronal survival in the adult brain. Expression of this gene is reduced in Alzheimer's, Parkinson's, and Huntington's disease patients. This gene may play a role in the regulation of the stress response and in the biology of mood disorders.`,
        chromosome: 11,
        position_GRCh38: 27700188,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs5848",
        geneName: "GRN",
        geneSummary: `Granulins are a family of secreted, glycosylated peptides that are cleaved from a single precursor protein with 7.5 repeats of a highly conserved 12-cysteine granulin/epithelin motif. The 88 kDa precursor protein, progranulin, is also called proepithelin and PC cell-derived growth factor. Cleavage of the signal peptide produces mature granulin which can be further cleaved into a variety of active, 6 kDa peptides. These smaller cleavage products are named granulin A, granulin B, granulin C, etc. Epithelins 1 and 2 are synonymous with granulins A and B, respectively. Both the peptides and intact granulin protein regulate cell growth. However, different members of the granulin protein family may act as inhibitors, stimulators, or have dual actions on cell growth. Granulin family members are important in normal development, wound healing, and tumorigenesis.`,
        chromosome: 17,
        position_GRCh38: 44352876,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs5918",
        geneName: "ITGB3",
        geneSummary: `The ITGB3 protein product is the integrin beta chain beta 3. Integrins are integral cell-surface proteins composed of an alpha chain and a beta chain. A given chain may combine with multiple partners resulting in different integrins. Integrin beta 3 is found along with the alpha IIb chain in platelets. Integrins are known to participate in cell adhesion as well as cell-surface mediated signalling`,
        chromosome: 17,
        position_GRCh38: 47283364,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs592389",
        geneName: "17HSDB1",
        geneSummary: `The 17HSDB1 gene codes for a specific enzyme of the 17 beta hydroxysteroid dehydrogenase (17HSDB) family, which play an important role in estrogen synthesis within the body. 17HSDB1 is specifically responsible for converting estrone, a weak estrogen, into estradiol, a strong estrogen with robust biological effects. SNPs in the 17HSDB1 gene can impact this conversion, affecting estradiol levels in the body. This is particularly significant during menopause, where dramatic changes to estrogen levels results in the myriad of peri- and postmenopausal symptoms.`,
        chromosome: 17,
        position_GRCh38: 42555426,
        referenceAllele: "A",
        altAllele: "C"
    },
    {
        rsId: "rs6025",
        geneName: "F5",
        geneSummary: `This gene encodes an essential cofactor of the blood coagulation cascade. This factor circulates in plasma, and is converted to the active form by the release of the activation peptide by thrombin during coagulation. This generates a heavy chain and a light chain which are held together by calcium ions. The activated protein is a cofactor that participates with activated coagulation factor X to activate prothrombin to thrombin. Defects in this gene result in either an autosomal recessive hemorrhagic diathesis or an autosomal dominant form of thrombophilia, which is known as activated protein C resistance.`,
        chromosome: 1,
        position_GRCh38: 169549811,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs6152",
        geneName: "AR",
        geneSummary: `The androgen receptor gene is more than 90 kb long and codes for a protein that has 3 major functional domains: the N-terminal domain, DNA-binding domain, and androgen-binding domain. The protein functions as a steroid-hormone activated transcription factor. Upon binding the hormone ligand, the receptor dissociates from accessory proteins, translocates into the nucleus, dimerizes, and then stimulates transcription of androgen responsive genes. This gene contains 2 polymorphic trinucleotide repeat segments that encode polyglutamine and polyglycine tracts in the N-terminal transactivation domain of its protein. Expansion of the polyglutamine tract from the normal 9-34 repeats to the pathogenic 38-62 repeats causes spinal bulbar muscular atrophy (SBMA, also known as Kennedy's disease). Mutations in this gene are also associated with complete androgen insensitivity (CAIS). Alternative splicing results in multiple transcript variants encoding different isoforms.`,
        chromosome: 23,
        position_GRCh38: 67545785,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs615942",
        geneName: "17HSDB1",
        geneSummary: `The 17HSDB1 gene codes for a specific enzyme of the 17 beta hydroxysteroid dehydrogenase (17HSDB) family, which play an important role in estrogen synthesis within the body. 17HSDB1 is specifically responsible for converting estrone, a weak estrogen, into estradiol, a strong estrogen with robust biological effects. SNPs in the 17HSDB1 gene can impact this conversion, affecting estradiol levels in the body. This is particularly significant during menopause, where dramatic changes to estrogen levels results in the myriad of peri- and postmenopausal symptoms.`,
        chromosome: 17,
        position_GRCh38: 42562786,
        referenceAllele: "C",
        altAllele: "A"
    },
    {
        rsId: "rs6180",
        geneName: "GHR",
        geneSummary: `This gene encodes a member of the type I cytokine receptor family, which is a transmembrane receptor for growth hormone. Binding of growth hormone to the receptor leads to receptor dimerization and the activation of an intra- and intercellular signal transduction pathway leading to growth. Mutations in this gene have been associated with Laron syndrome, also known as the growth hormone insensitivity syndrome (GHIS), a disorder characterized by short stature. In humans and rabbits, but not rodents, growth hormone binding protein (GHBP) is generated by proteolytic cleavage of the extracellular ligand-binding domain from the mature growth hormone receptor protein. Multiple alternatively spliced transcript variants have been found for this gene`,
        chromosome: 5,
        position_GRCh38: 42719137,
        referenceAllele: "A",
        altAllele: "C"
    },
    {
        rsId: "rs6184",
        geneName: "GHR",
        geneSummary: `This gene encodes a member of the type I cytokine receptor family, which is a transmembrane receptor for growth hormone. Binding of growth hormone to the receptor leads to receptor dimerization and the activation of an intra- and intercellular signal transduction pathway leading to growth. Mutations in this gene have been associated with Laron syndrome, also known as the growth hormone insensitivity syndrome (GHIS), a disorder characterized by short stature. In humans and rabbits, but not rodents, growth hormone binding protein (GHBP) is generated by proteolytic cleavage of the extracellular ligand-binding domain from the mature growth hormone receptor protein. Multiple alternatively spliced transcript variants have been found for this gene`,
        chromosome: 5,
        position_GRCh38: 42719242,
        referenceAllele: "C",
        altAllele: "A"
    },
    {
        rsId: "rs6188",
        geneName: "NR3C1",
        geneSummary: `This gene encodes glucocorticoid receptor, which can function both as a transcription factor that binds to glucocorticoid response elements in the promoters of glucocorticoid responsive genes to activate their transcription, and as a regulator of other transcription factors. This receptor is typically found in the cytoplasm, but upon ligand binding, is transported into the nucleus. It is involved in inflammatory responses, cellular proliferation, and differentiation in target tissues. Mutations in this gene are associated with generalized glucocorticoid resistance. Alternative splicing of this gene results in transcript variants encoding either the same or different isoforms. Additional isoforms resulting from the use of alternate in-frame translation initiation sites have also been described, and shown to be functional, displaying diverse cytoplasm-to-nucleus trafficking patterns and distinct transcriptional activities`,
        chromosome: 5,
        position_GRCh38: 143300779,
        referenceAllele: "C",
        altAllele: "A"
    },
    {
        rsId: "rs6189",
        geneName: "NR3C1",
        geneSummary: `NR3C1 encodes the glucocorticoid (cortisol) receptor, the master switch for how your brain and tissues respond to stress. Small differences at rs6195 can tilt cortisol sensitivity, changing the “gain” on stress signaling and downstream effects on inflammation, energy use, mood/sleep, and the HPT axis (since higher or more prolonged cortisol can transiently dampen testosterone production). In real life, this shows up as variability in sleep quality, morning alertness, recovery from training, abdominal fat tendency, and motivation under pressure. Treat it as a stress-response dial: anchor regular sleep/wake, build a base of aerobic + resistance training, use daytime light exposure, prioritize protein and fiber with steady carbs (especially around training), and add stress brakes (breath work, mindfulness, evening low-light) to keep cortisol, and thus testosterone, on a healthy rhythm.`,
        chromosome: 5,
        position_GRCh38: 143400774,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs6189 (ER22/23EK)",
        geneName: "NR3C1",
        geneSummary: `NR3C1 encodes the glucocorticoid (cortisol) receptor, the master switch for how your brain and tissues respond to stress. Small differences at rs6195 can tilt cortisol sensitivity, changing the “gain” on stress signaling and downstream effects on inflammation, energy use, mood/sleep, and the HPT axis (since higher or more prolonged cortisol can transiently dampen testosterone production). In real life, this shows up as variability in sleep quality, morning alertness, recovery from training, abdominal fat tendency, and motivation under pressure. Treat it as a stress-response dial: anchor regular sleep/wake, build a base of aerobic + resistance training, use daytime light exposure, prioritize protein and fiber with steady carbs (especially around training), and add stress brakes (breath work, mindfulness, evening low-light) to keep cortisol, and thus testosterone, on a healthy rhythm.`,
        chromosome: 5,
        position_GRCh38: 143400774,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs6190",
        geneName: "NR3C1",
        geneSummary: `NR3C1 encodes the glucocorticoid (cortisol) receptor, the master switch for how your brain and tissues respond to stress. Small differences at rs6195 can tilt cortisol sensitivity, changing the “gain” on stress signaling and downstream effects on inflammation, energy use, mood/sleep, and the HPT axis (since higher or more prolonged cortisol can transiently dampen testosterone production). In real life, this shows up as variability in sleep quality, morning alertness, recovery from training, abdominal fat tendency, and motivation under pressure. Treat it as a stress-response dial: anchor regular sleep/wake, build a base of aerobic + resistance training, use daytime light exposure, prioritize protein and fiber with steady carbs (especially around training), and add stress brakes (breath work, mindfulness, evening low-light) to keep cortisol, and thus testosterone, on a healthy rhythm.`,
        chromosome: 5,
        position_GRCh38: 143400772,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs6190 (ER22/23EK)",
        geneName: "NR3C1",
        geneSummary: `NR3C1 encodes the glucocorticoid (cortisol) receptor, the master switch for how your brain and tissues respond to stress. Small differences at rs6195 can tilt cortisol sensitivity, changing the “gain” on stress signaling and downstream effects on inflammation, energy use, mood/sleep, and the HPT axis (since higher or more prolonged cortisol can transiently dampen testosterone production). In real life, this shows up as variability in sleep quality, morning alertness, recovery from training, abdominal fat tendency, and motivation under pressure. Treat it as a stress-response dial: anchor regular sleep/wake, build a base of aerobic + resistance training, use daytime light exposure, prioritize protein and fiber with steady carbs (especially around training), and add stress brakes (breath work, mindfulness, evening low-light) to keep cortisol, and thus testosterone, on a healthy rhythm.`,
        chromosome: 5,
        position_GRCh38: 143400772,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs6195 (N363S)",
        geneName: "NR3C1",
        geneSummary: `NR3C1 encodes the glucocorticoid (cortisol) receptor, the master switch for how your brain and tissues respond to stress. Small differences at rs6195 can tilt cortisol sensitivity, changing the “gain” on stress signaling and downstream effects on inflammation, energy use, mood/sleep, and the HPT axis (since higher or more prolonged cortisol can transiently dampen testosterone production). In real life, this shows up as variability in sleep quality, morning alertness, recovery from training, abdominal fat tendency, and motivation under pressure. Treat it as a stress-response dial: anchor regular sleep/wake, build a base of aerobic + resistance training, use daytime light exposure, prioritize protein and fiber with steady carbs (especially around training), and add stress brakes (breath work, mindfulness, evening low-light) to keep cortisol, and thus testosterone, on a healthy rhythm.`,
        chromosome: 5,
        position_GRCh38: 143399752,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs6198",
        geneName: "NR3C1",
        geneSummary: `NR3C1 encodes the glucocorticoid (cortisol) receptor, the master switch for how your brain and tissues respond to stress. Small differences at rs6195 can tilt cortisol sensitivity, changing the “gain” on stress signaling and downstream effects on inflammation, energy use, mood/sleep, and the HPT axis (since higher or more prolonged cortisol can transiently dampen testosterone production). In real life, this shows up as variability in sleep quality, morning alertness, recovery from training, abdominal fat tendency, and motivation under pressure. Treat it as a stress-response dial: anchor regular sleep/wake, build a base of aerobic + resistance training, use daytime light exposure, prioritize protein and fiber with steady carbs (especially around training), and add stress brakes (breath work, mindfulness, evening low-light) to keep cortisol, and thus testosterone, on a healthy rhythm.`,
        chromosome: 5,
        position_GRCh38: 143278056,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs6198 (9β)",
        geneName: "NR3C1",
        geneSummary: `NR3C1 encodes the glucocorticoid (cortisol) receptor, the master switch for how your brain and tissues respond to stress. Small differences at rs6195 can tilt cortisol sensitivity, changing the “gain” on stress signaling and downstream effects on inflammation, energy use, mood/sleep, and the HPT axis (since higher or more prolonged cortisol can transiently dampen testosterone production). In real life, this shows up as variability in sleep quality, morning alertness, recovery from training, abdominal fat tendency, and motivation under pressure. Treat it as a stress-response dial: anchor regular sleep/wake, build a base of aerobic + resistance training, use daytime light exposure, prioritize protein and fiber with steady carbs (especially around training), and add stress brakes (breath work, mindfulness, evening low-light) to keep cortisol, and thus testosterone, on a healthy rhythm.`,
        chromosome: 5,
        position_GRCh38: 143278056,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs6201",
        geneName: "HSD3B1",
        geneSummary: `The protein encoded by this gene is an enzyme that catalyzes the oxidative conversion of delta-5-3-beta-hydroxysteroid precursors into delta-4-ketosteroids, which leads to the production of all classes of steroid hormones. The encoded protein also catalyzes the interconversion of 3-beta-hydroxy- and 3-keto-5-alpha-androstane steroids.`,
        chromosome: 1,
        position_GRCh38: 119511592,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs6257",
        geneName: "SHBG",
        geneSummary: `SHBG is the liver-made carrier that binds testosterone and estradiol in the bloodstream, controlling how much is free/bioavailable to tissues. Differences at rs6257 can shift SHBG levels/behavior, which may nudge free T, the T↔E2 balance, and downstream traits like libido, energy, body-fat patterning, and lipid/vascular markers. Real-world impact SHBG is the liver-made carrierdepends on context—insulin resistance, thyroid status, body fat, sleep, alcohol, and meds all move SHBG—so treat rs6257 as a bioavailability dial and support with protein + fiber, resistance + aerobic training, and consistent sleep.`,
        chromosome: 17,
        position_GRCh38: 7630399,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs6259",
        geneName: "SHBG",
        geneSummary: `SHBG is the liver-made carrier that binds testosterone and estradiol in the blood, controlling how much is free/bioavailable to tissues. The rs6259 (Asp327Asn) variant can shift circulating SHBG levels/behavior, which may nudge free T, E2 balance, and downstream traits like libido, energy, body-fat patterning, and lipid/vascular markers. Because SHBG also interacts with insulin, thyroid status, and body fat, the real-world effect depends on sleep, diet, training, alcohol, and meds. Think of rs6259 as a bioavailability dial—optimize the basics (protein-forward meals, fiber, resistance + aerobic training, consistent sleep) to keep free hormones in a healthy range.`,
        chromosome: 17,
        position_GRCh38: 7633209,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs6265",
        geneName: "BDNF",
        geneSummary: `BDNF encodes a vital neurotrophin that supports neuronal growth, synaptic plasticity, and brain–hormone communication, especially within the hypothalamic and limbic regions that regulate stress and reproductive signaling. In women, BDNF influences hypothalamic–pituitary–gonadal (HPG) axis function, impacting how the brain responds to estrogen, progesterone, and cortisol. Variations in rs6265 can alter BDNF secretion and receptor sensitivity, affecting mood stability, cycle regularity, and resilience during hormonal transitions such as perimenopause and menopause. Optimal BDNF expression supports emotional balance, cognitive clarity, libido, and energy regulation, making it a key link between brain health, hormone balance, and overall vitality.`,
        chromosome: 11,
        position_GRCh38: 27658369,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs6280",
        geneName: "DRD3",
        geneSummary: `This gene encodes the D3 subtype of the five (D1-D5) dopamine receptors. The activity of the D3 subtype receptor is mediated by G proteins which inhibit adenylyl cyclase. This receptor is localized to the limbic areas of the brain, which are associated with cognitive, emotional, and endocrine functions. Genetic variation in this gene may be associated with susceptibility to hereditary essential tremor 1. Alternative splicing of this gene results in transcript variants encoding different isoforms, although some variants may be subject to nonsense-mediated decay (NMD).`,
        chromosome: 3,
        position_GRCh38: 114171968,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs6313",
        geneName: "HTR2A",
        geneSummary: `This gene encodes one of the receptors for serotonin, a neurotransmitter with many roles. Mutations in this gene are associated with susceptibility to schizophrenia and obsessive-compulsive disorder, and are also associated with response to the antidepressant citalopram in patients with major depressive disorder (MDD). MDD patients who also have a mutation in intron 2 of this gene show a significantly reduced response to citalopram as this antidepressant downregulates expression of this gene. Multiple transcript variants encoding different isoforms have been found for this gene.`,
        chromosome: 13,
        position_GRCh38: 46895805,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs662799",
        geneName: "APOA5",
        geneSummary: `The protein encoded by this gene is an apolipoprotein that plays an important role in regulating the plasma triglyceride levels, a major risk factor for coronary artery disease. It is a component of high density lipoprotein and is highly similar to a rat protein that is upregulated in response to liver injury. Mutations in this gene have been associated with hypertriglyceridemia and hyperlipoproteinemia type 5. This gene is located proximal to the apolipoprotein gene cluster on chromosome 11q23. Alternatively spliced transcript variants encoding the same protein have been identified.`,
        chromosome: 11,
        position_GRCh38: 116792991,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs670",
        geneName: "APOA1",
        geneSummary: `This gene encodes apolipoprotein A-I, which is the major protein component of high density lipoprotein (HDL) in plasma. The encoded preproprotein is proteolytically processed to generate the mature protein, which promotes cholesterol efflux from tissues to the liver for excretion, and is a cofactor for lecithin cholesterolacyltransferase (LCAT), an enzyme responsible for the formation of most plasma cholesteryl esters. This gene is closely linked with two other apolipoprotein genes on chromosome 11. Defects in this gene are associated with HDL deficiencies, including Tangier disease, and with systemic non-neuropathic amyloidosis. Alternative splicing results in multiple transcript variants, at least one of which encodes a preproprotein.`,
        chromosome: 11,
        position_GRCh38: 116837697,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs670139",
        geneName: "MS4A4E",
        geneSummary: "Most MS4A genes, including MS4A4E, encode proteins with at least 4 potential transmembrane domains and N- and C-terminal cytoplasmic domains encoded by distinct exons.",
        chromosome: 11,
        position_GRCh38: 60204322,
        referenceAllele: "G",
        altAllele: "T"
    },
    {
        rsId: "rs6721961",
        geneName: "NFE2L2",
        geneSummary: `This gene encodes a transcription factor which is a member of a small family of basic leucine zipper (bZIP) proteins. The encoded transcription factor regulates genes which contain antioxidant response elements (ARE) in their promoters; many of these genes encode proteins involved in response to injury and inflammation which includes the production of free radicals. Multiple transcript variants encoding different isoforms have been characterized for this gene.`,
        chromosome: 2,
        position_GRCh38: 177265309,
        referenceAllele: "T",
        altAllele: "G"
    },
    {
        rsId: "rs6797312",
        geneName: "SERPINI1",
        geneSummary: `This gene encodes a member of the serpin superfamily of serine proteinase inhibitors. The protein is primarily secreted by axons in the brain, and preferentially reacts with and inhibits tissue-type plasminogen activator. It is thought to play a role in the regulation of axonal growth and the development of synaptic plasticity. Mutations in this gene result in familial encephalopathy with neuroserpin inclusion bodies (FENIB), which is a dominantly inherited form of familial encephalopathy and epilepsy characterized by the accumulation of mutant neuroserpin polymers. Multiple alternatively spliced variants, encoding the same protein, have been identified.`,
        chromosome: 3,
        position_GRCh38: 167769515,
        referenceAllele: "A",
        altAllele: "T"
    },
    {
        rsId: "rs6797911",
        geneName: "MME",
        geneSummary: `The protein encoded by this gene is a type II transmembrane glycoprotein and a common acute lymphocytic leukemia antigen that is an important cell surface marker in the diagnosis of human acute lymphocytic leukemia (ALL). The encoded protein is present on leukemic cells of pre-B phenotype, which represent 85% of cases of ALL. This protein is not restricted to leukemic cells, however, and is found on a variety of normal tissues. The protein is a neutral endopeptidase that cleaves peptides at the amino side of hydrophobic residues and inactivates several peptide hormones including glucagon, enkephalins, substance P, neurotensin, oxytocin, and bradykinin.`,
        chromosome: 3,
        position_GRCh38: 155144601,
        referenceAllele: "T",
        altAllele: "A"
    },
    {
        rsId: "rs6843082",
        geneName: "PITX2",
        geneSummary: `This gene encodes a member of the RIEG/PITX homeobox family, which is in the bicoid class of homeodomain proteins. The encoded protein acts as a transcription factor and regulates procollagen lysyl hydroxylase gene expression. This protein plays a role in the terminal differentiation of somatotroph and lactotroph cell phenotypes, is involved in the development of the eye, tooth and abdominal organs, and acts as a transcriptional regulator involved in basal and hormone-regulated activity of prolactin. Mutations in this gene are associated with Axenfeld-Rieger syndrome, iridogoniodysgenesis syndrome, and sporadic cases of Peters anomaly. A similar protein in other vertebrates is involved in the determination of left-right asymmetry during development. Alternatively spliced transcript variants encoding distinct isoforms have been described.`,
        chromosome: 4,
        position_GRCh38: 110796911,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs700519",
        geneName: "CYP19A1",
        geneSummary: `This gene encodes a member of the cytochrome P450 superfamily of enzymes. The cytochrome P450 proteins are monooxygenases which catalyze many reactions involved in drug metabolism and synthesis of cholesterol, steroids and other lipids. This protein localizes to the endoplasmic reticulum and catalyzes the last steps of estrogen biosynthesis. Mutations in this gene can result in either increased or decreased aromatase activity; the associated phenotypes suggest that estrogen functions both as a sex steroid hormone and in growth or differentiation. Alternative promoter use and alternative splicing results in multiple transcript variants that have different tissue specificities.`,
        chromosome: 15,
        position_GRCh38: 51215771,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs7209436",
        geneName: "CRHR1",
        geneSummary: `This gene encodes a G-protein coupled receptor that binds neuropeptides of the corticotropin releasing hormone family that are major regulators of the hypothalamic-pituitary-adrenal pathway. The encoded protein is essential for the activation of signal transduction pathways that regulate diverse physiological processes including stress, reproduction, immune response and obesity. Alternative splicing results in multiple transcript variants. Naturally-occurring readthrough transcription between this gene and upstream GeneID:147081 results in transcripts that encode isoforms that share similarity with the products of this gene.`,
        chromosome: 17,
        position_GRCh38: 43870142,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs727428",
        geneName: "SHBG",
        geneSummary: `SHBG is the liver-made carrier that binds testosterone and estradiol in the bloodstream, controlling how much is free/bioavailable to tissues. Variation at rs727428 can shift SHBG production/function, which may nudge free T, the overall T↔E2 balance, and downstream traits like libido, energy, body-fat patterning, and lipid/vascular markers. Because SHBG also responds to insulin status, thyroid hormones, body fat, sleep, alcohol, and certain meds, treat rs727428 as a bioavailability dial—support with protein-forward, fiber-rich nutrition, consistent resistance + aerobic training, and regular sleep to help keep free hormones in a healthy range.`,
        chromosome: 17,
        position_GRCh38: 7634474,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs73598374",
        geneName: "ADA",
        geneSummary: `This gene encodes an enzyme that catalyzes the hydrolysis of adenosine to inosine in the purine catabolic pathway. Various mutations have been described for this gene and have been linked to human diseases related to impaired immune function such as severe combined immunodeficiency disease (SCID) which is the result of a deficiency in the ADA enzyme. In ADA-deficient individuals there is a marked depletion of T, B, and NK lymphocytes, and consequently, a lack of both humoral and cellular immunity. Conversely, elevated levels of this enzyme are associated with congenital hemolytic anemia.`,
        chromosome: 20,
        position_GRCh38: 44651586,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs7412",
        geneName: "APOE",
        geneSummary: `The protein encoded by this gene is a major apoprotein of the chylomicron. It binds to a specific liver and peripheral cell receptor, and is essential for the normal catabolism of triglyceride-rich lipoprotein constituents. This gene maps to chromosome 19 in a cluster with the related apolipoprotein C1 and C2 genes. Mutations in this gene result in familial dysbetalipoproteinemia, or type III hyperlipoproteinemia (HLP III), in which increased plasma cholesterol and triglycerides are the consequence of impaired clearance of chylomicron and VLDL remnants.`,
        chromosome: 19,
        position_GRCh38: 44908822,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs743572",
        geneName: "CYP19A1",
        geneSummary: `This gene encodes a member of the cytochrome P450 superfamily of enzymes. The cytochrome P450 proteins are monooxygenases which catalyze many reactions involved in drug metabolism and synthesis of cholesterol, steroids and other lipids. This protein localizes to the endoplasmic reticulum and catalyzes the last steps of estrogen biosynthesis. Mutations in this gene can result in either increased or decreased aromatase activity; the associated phenotypes suggest that estrogen functions both as a sex steroid hormone and in growth or differentiation. Alternative promoter use and alternative splicing results in multiple transcript variants that have different tissue specificities.`,
        chromosome: 10,
        position_GRCh38: 102837395,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs7542281",
        geneName: "F5",
        geneSummary: `This gene encodes an essential cofactor of the blood coagulation cascade. This factor circulates in plasma, and is converted to the active form by the release of the activation peptide by thrombin during coagulation. This generates a heavy chain and a light chain which are held together by calcium ions. The activated protein is a cofactor that participates with activated coagulation factor X to activate prothrombin to thrombin. Defects in this gene result in either an autosomal recessive hemorrhagic diathesis or an autosomal dominant form of thrombophilia, which is known as activated protein C resistance.`,
        chromosome: 1,
        position_GRCh38: 169567201,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs75932628",
        geneName: "TREM2",
        geneSummary: `This gene encodes a membrane protein that forms a receptor signaling complex with the TYRO protein tyrosine kinase binding protein. The encoded protein functions in immune response and may be involved in chronic inflammation by triggering the production of constitutive inflammatory cytokines. Defects in this gene are a cause of polycystic lipomembranous osteodysplasia with sclerosing leukoencephalopathy (PLOSL). Alternative splicing results in multiple transcript variants encoding different isoforms.`,
        chromosome: 6,
        position_GRCh38: 41161514,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs7946",
        geneName: "PEMT",
        geneSummary: `Phosphatidylcholine (PC) is the most abundant mammalian phospholipid. This gene encodes an enzyme which converts phosphatidylethanolamine to phosphatidylcholine by sequential methylation in the liver. Another distinct synthetic pathway in nucleated cells converts intracellular choline to phosphatidylcholine by a three-step process. The protein isoforms encoded by this gene localize to the endoplasmic reticulum and mitochondria-associated membranes. Alternate splicing of this gene results in multiple transcript variants encoding different isoforms.`,
        chromosome: 17,
        position_GRCh38: 17506246,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs7984870",
        geneName: "TNFSF11",
        geneSummary: `TNFSF11 encodes RANKL, a cytokine in the tumor necrosis factor (TNF) ligand superfamily. RANKL is the master switch for bone resorption (activates osteoclasts) and also shapes immune signaling. In men, physiologic estradiol (from testosterone via aromatase) helps keep RANKL activity in check—supporting bone density and recovery from training. The rs7984870 variant can fine-tune RANKL expression, which may influence bone mineral density, fracture risk, and adaptation to load; it also sits at an immune–bone crossroads relevant to inflammation and the tumor-necrosis-factor pathway. Practical levers: progressive resistance training, vitamin D + calcium + adequate protein, and maintaining a healthy T↔E2 balanc`,
        chromosome: 13,
        position_GRCh38: 42572346,
        referenceAllele: "G",
        altAllele: "C"
    },
    {
        rsId: "rs800292",
        geneName: "CFH (162V)",
        geneSummary: `This gene is a member of the Regulator of Complement Activation (RCA) gene cluster and encodes a protein with twenty short consensus repeat (SCR) domains. This protein is secreted into the bloodstream and has an essential role in the regulation of complement activation, restricting this innate defense mechanism to microbial infections. Mutations in this gene have been associated with hemolytic-uremic syndrome (HUS) and chronic hypocomplementemic nephropathy. Alternate transcriptional splice variants, encoding different isoforms, have been characterized.`,
        chromosome: 1,
        position_GRCh38: 196673103,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs806368",
        geneName: "CNR1",
        geneSummary: `CNR1 encodes the CB1 receptor, a key “volume knob” for neural signaling in pain and nausea pathways. CB1 is dense in the periaqueductal gray, spinal cord dorsal horn, thalamus, and brainstem emetic centers, where it dampens incoming pain signals and helps suppress the nausea/vomiting reflex. Variation at rs806368 can modestly shift CB1 tone—changing pain threshold/tolerance, nausea sensitivity (motion, meds), and the brain’s ability to gate those sensations under stress or poor sleep. Think of it as your built-in anti-noise filter for discomfort: when CB1 signaling is stronger, pain and nausea are easier to modulate; when it’s lighter, you may notice greater sensitivity. Practical levers that generally support this pathway include consistent sleep, stress downshifts (breath work/slow exhales), regular aerobic + resistance training, stable blood sugar, and careful timing of triggers`,
        chromosome: 6,
        position_GRCh38: 88140381,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs806378",
        geneName: "CNR1",
        geneSummary: `CNR1 encodes the CB1 receptor, a master tuner of mood circuits that balances GABA (calming), glutamate (excitatory), and dopamine (motivation/reward). Variation at rs806380 can subtly shift CB1 signaling efficiency, which may influence baseline mood stability, stress reactivity, emotional resilience, and how quickly you “come back to center” after pressure or conflict. When CB1 tone runs lighter, people may notice heightened irritability, rumination, sleep fragmentation, or stress-eating; stronger tone often tracks with smoother affect and better stress dampening. This is a tuning knob—not destiny—so lean on levers that support endocannabinoid tone: consistent sleep, regular aerobic + resistance training, omega-3–rich foods, daytime light exposure, stress downshifts (slow exhales, mindfulness), and moderating alcohol/high-sugar spikes that can destabilize mood circuits`,
        chromosome: 6,
        position_GRCh38: 88149832,
        referenceAllele: "C",
        altAllele: "T"
    },
    {
        rsId: "rs806380",
        geneName: "CNR1",
        geneSummary: `CNR1 codes for the CB1 receptor that helps maintain emotional equilibrium by regulating neurotransmitter balance in mood circuits. This system modulates the release of GABA (calming), glutamate (excitatory), and dopamine (reward/motivation) to keep neural activity in the optimal range for emotional wellbeing. The rs806380 variant influences how effectively your brain uses CB1 receptors to manage mood, regulate stress responses, and maintain psychological balance. This genetic difference may affect mood stability, stress reactivity, and baseline risk for mood disorders. The system is particularly important for dampening excessive neural activity during stress or negative emotions.`,
        chromosome: 6,
        position_GRCh38: 88154934,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs879324",
        geneName: "ZFHX3",
        geneSummary: `This gene encodes a transcription factor with multiple homeodomains and zinc finger motifs, and regulates myogenic and neuronal differentiation. The encoded protein suppresses expression of the alpha-fetoprotein gene by binding to an AT-rich enhancer motif. The protein has also been shown to negatively regulate c-Myb, and transactivate the cell cycle inhibitor cyclin-dependent kinase inhibitor 1A (also known as p21CIP1). This gene is reported to function as a tumor suppressor in several cancers, and sequence variants of this gene are also associated with atrial fibrillation. Multiple transcript variants expressed from alternate promoters and encoding different isoforms have been found for this gene.`,
        chromosome: 16,
        position_GRCh38: 73034779,
        referenceAllele: "G",
        altAllele: "A"
    },
    {
        rsId: "rs897798",
        geneName: "BRSK1/TMEM224",
        geneSummary: `This region near BRSK1/TMEM224 helps set the timing and strength of hormone signals—like part of the wiring that keeps the hypothalamus–pituitary–testes (HPT) axis on beat. It also touches cellular “cleanup” (autophagy), which supports steady signaling.
 In men, certain versions of rs897798 may slightly tune:
 the morning peak and daily rhythm of testosterone, how well you recover from stress and training, and background metabolic “noise” that can blunt hormone signals.`,
        chromosome: 19,
        position_GRCh38: 55322386,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs9296158",
        geneName: "FKBP5",
        geneSummary: `FKBP5 is a co-chaperone that tunes glucocorticoid receptor (cortisol) sensitivity. The rs1360780 setting can shift how quickly the body shuts off a stress response (negative feedback), effectively changing your cortisol “gain.” In men, that tuning can influence sleep quality, morning alertness and testosterone rhythm, abdominal fat tendency, mood/irritability, and training recovery—because prolonged or higher cortisol pulses transiently dampen testosterone and blunt anabolism. Think of this SNP as a stress-response dial, not a diagnosis. Helpful levers: consistent sleep/wake timing, strong morning light, a base of zone-2 + resistance training, protein + fiber with moderated alcohol, and nightly wind-down (low light, breath work) to keep cortisol—and thus hormones—on a healthy rhythm.`,
        chromosome: 6,
        position_GRCh38: 35599305,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs9340799",
        geneName: "ESR1",
        geneSummary: `ESR1 codes for the Estrogen Receptor α protein, a protein in your body that responds to the hormone estrogen. When estrogen binds to this receptor, it impacts the expression of other genes to help regulate processes like growth, development, bone health, and the menstrual cycle. Changes in the ESR1 gene can affect how your body responds to the drops in estrogen that occur during menopause, potentially linking to certain menopausal symptoms.`,
        chromosome: 6,
        position_GRCh38: 151842246,
        referenceAllele: "A",
        altAllele: "G"
    },
    {
        rsId: "rs9470080",
        geneName: "FKBP5",
        geneSummary: `FKBP5 is a co-chaperone that tunes glucocorticoid receptor (cortisol) sensitivity. The rs1360780 setting can shift how quickly the body shuts off a stress response (negative feedback), effectively changing your cortisol “gain.” In men, that tuning can influence sleep quality, morning alertness and testosterone rhythm, abdominal fat tendency, mood/irritability, and training recovery—because prolonged or higher cortisol pulses transiently dampen testosterone and blunt anabolism. Think of this SNP as a stress-response dial, not a diagnosis. Helpful levers: consistent sleep/wake timing, strong morning light, a base of zone-2 + resistance training, protein + fiber with moderated alcohol, and nightly wind-down (low light, breath work) to keep cortisol—and thus hormones—on a healthy rhythm.`,
        chromosome: 6,
        position_GRCh38: 35646435,
        referenceAllele: "T",
        altAllele: "C"
    },
    {
        rsId: "rs9527025",
        geneName: "KL",
        geneSummary: `This gene encodes a type-I membrane protein that is related to beta-glucosidases. Reduced production of this protein has been observed in patients with chronic renal failure (CRF), and this may be one of the factors underlying the degenerative processes (e.g., arteriosclerosis, osteoporosis, and skin atrophy) seen in CRF. Also, mutations within this protein have been associated with ageing and bone loss.`,
        chromosome: 13,
        position_GRCh38: 33054056,
        referenceAllele: "G",
        altAllele: "C"
    },
    {
        rsId: "rs9536314",
        geneName: "KL",
        geneSummary: `Klotho is a hormone-modulating protein that regulates FGF23 signaling, phosphate and calcium balance, and endocrine control of mineral metabolism. It influences skeletal ageing, vascular tone, and renal hormone pathways. Variants in KL can alter signaling efficiency, mineral homeostasis, and age-related bone and vascular outcomes, especially in postmenopausal physiology.`,
        chromosome: 13,
        position_GRCh38: 33054001,
        referenceAllele: "T",
        altAllele: "G"
    },
    {
        rsId: "rs9939609",
        geneName: "FTO",
        geneSummary: `FTO is a master dial on hunger/satiety signaling. The A allele at rs9939609 is linked to a higher drive to eat energy-dense foods, slightly weaker fullness signals, and a tendency to store excess as fat—effects that can feel louder in peri/post-menopause when lower estrogen blunts leptin sensitivity, disrupts sleep, and shifts where fat is stored. Think of this variant as an appetite thermostat, not destiny: the lever set that helps most women includes front-loading protein (25–35g/meal), high-fiber meals (≥30g/day), deliberate food structure (preload with salad/veg), resistance training 2–3×/week, consistent sleep, and minimizing ultra-processed “easy calories.” For those using HRT, improved sleep and appetite control can further tame FTO-driven cues.`,
        chromosome: 16,
        position_GRCh38: 53786615,
        referenceAllele: "T",
        altAllele: "A"
    }
]