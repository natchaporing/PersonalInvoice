# Change Details @ 2024-08-02
---------------------------
1.ไฟล์ Invoice_CrossIndustryInvoice_2p0.xsd แก้ไขโครงสร้างข้อมูลของ 3.3.4.3 TypeCode จากประเภท Max16Text เป็น PaymentTermsTypeCodeType

2.ไฟล์ TaxInvoice_CrossIndustryInvoice_2p0.xsd แก้ไขโครงสร้างข้อมูลของ 3.3.4.3 TypeCode จากประเภท Max16Text เป็น PaymentTermsTypeCodeType

3.ไฟล์ AbbreviatedTaxInvoice_CrossIndustryInvoice_2p0.xsd แก้ไขโครงสร้างข้อมูลของ 3.3.4.3 TypeCode จากประเภท Max16Text เป็น PaymentTermsTypeCodeType

# Change Details @ 2024-07-25
---------------------------
1. ไฟล์ Receipt_CrossIndustryInvoice_2p0.xsd ปรับโครงสร้างข้อมูลของ 3.3.4 SpecifiedTradePaymentTerms แก้ไขการเรียง sequence จาก TypeCode, Description, DueDateDateTime  เป็น Description, DueDateDateTime, TypeCode 
2. ไฟล์ Receipt_CrossIndustryInvoice_2p0.xsd แก้ไข index 3.4.2.6.2 ClassName ชื่อหมวดหมู่สินค้า ปรับ Multi เป็น 0..n
3. ไฟล์ Receipt_CrossIndustryInvoice_2p0.sch แก้ไข index 3.1.5.3 เพิ่มเงื่อนไขให้ ReferenceTypeCode สามารถรับค่า T05, T06 ได้ 
4. ไฟล์ DebitCreditNote_CrossIndustryInvoice_2p0.xsd ปรับโครงสร้างข้อมูลของ 3.3.4.1 SpecifiedTradePaymentTerms แก้ไขการเรียง sequence จาก TypeCode, Description, DueDateDateTime  เป็น Description, DueDateDateTime, TypeCode
5. ไฟล์ DebitCreditNote_CrossIndustryInvoice_2p0.sch แก้ไข index 3.1.5.3 เพิ่มเงื่อนไขให้ ReferenceTypeCode สามารถรับค่า T05, T06 ได้ 

# Change Details @ 2024-01-30
---------------------------
เพิ่ม Country Code 3 รายการได้แก่ AN, KS, UN

# Change Details @ 2022-08-30
---------------------------
1.  DebitCredit_Schematron_2p0.sch แก้ไชไฟล์ Schematron แก้ filed IssueDateTime และ IssuerAssignID เป็น Mandatory
2.  TaxInvoice_Schematron_2p0.sch แก้ไชไฟล์ Schematron แก้ filed IssueDateTime และ IssuerAssignID เป็น Mandatory

# Change Details @ 2021-10-26
---------------------------
1.  Invoice_Schematron_2p0.sch แก้ไชไฟล์ Schematron ยกเลิกการเช็ค Name ของเอกสาร
	
# Change Details @ 2021-03-22
---------------------------
1.  Invoice_CrossIndustryInvoice_2p0.xsd 
    1.1.  เพิ่ม Element Signature ใน schema  
    


# Change Details @ 2019-12-11
---------------------------
1. แก้ไข TaxInvoice_Schematron_2p0.sch ดังนี้
    
    1.1. แก้ไข TIV-InvoicerTradeParty-008 กรณีระบุประเภทเลขประจำตัวผู้เสียภาษีอากรของผู้ซื้อ 
         เปลี่ยนเป็น TIV-InvoicerTradeParty-008 กรณีระบุประเภทเลขประจำตัวผู้เสียภาษีอากรของผู้ออกเอกสารแทน
   
    1.2. แก้ไข (BuyerTradeParty/SpecifiedTaxRegistration/ID) เปลี่ยนเป็น (InvoicerTradeParty/SpecifiedTaxRegistration/ID)

2. แก้ไข Receipt_Schematron_2p0.sch ดังนี้ 
    
    2.1. แก้ไข RCT-InvoicerTradeParty-008 กรณีระบุประเภทเลขประจำตัวผู้เสียภาษีอากรของผู้ซื้อ 
         เปลี่ยนเป็น  RCT-InvoicerTradeParty-008 กรณีระบุประเภทเลขประจำตัวผู้เสียภาษีอากรของผู้ออกเอกสารแทน
    
    2.2.  แก้ไข (BuyerTradeParty/SpecifiedTaxRegistration/ID) เปลี่ยนเป็น (InvoicerTradeParty/SpecifiedTaxRegistration/ID)

3. แก้ไขไฟล์ DebitCreditNote_Schematron_2p0.sch ดังนี้
  
    3.1.  แก้ไข DCN-InvoicerTradeParty-008 กรณีระบุประเภทเลขประจำตัวผู้เสียภาษีอากรของผู้ซื้อ 
         เปลี่ยนเป็น DCN-InvoicerTradeParty-008 กรณีระบุประเภทเลขประจำตัวผู้เสียภาษีอากรของผู้ออกเอกสารแทน
    
    3.2.  แก้ไข (BuyerTradeParty/SpecifiedTaxRegistration/ID) เปลี่ยนเป็น (InvoicerTradeParty/SpecifiedTaxRegistration/ID)