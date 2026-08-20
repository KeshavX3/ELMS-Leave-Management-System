namespace ELMS.API.DTOs
{
    public class UpdateDepartmentRequest
    {
        public string Name { get; set; } = "";

        public string Code { get; set; } = "";

        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }
}